'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getBrowserClient, apiFetch } from '@/lib/supabase/browser';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase/config';

type EditorState = 'loading' | 'guest' | 'signed-in' | 'editor';

interface EditorValue {
  state: EditorState;
  isEditor: boolean;
  email: string | null;
  notice: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const EditorContext = createContext<EditorValue | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EditorState>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data } = await getBrowserClient().auth.getSession();
    const session = data.session;
    if (!session) { setEmail(null); setState('guest'); return; }
    setEmail(session.user.email ?? null);
    const res = await apiFetch('/api/me').catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setState(json.editor ? 'editor' : 'signed-in');
  }, []);

  useEffect(() => {
    refresh();
    const { data } = getBrowserClient().auth.onAuthStateChange(() => { refresh(); });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const [dialog, setDialog] = useState(false);

  /** פותח את חלון הכניסה */
  const signIn = useCallback(async () => { setNotice(null); setDialog(true); }, []);

  const signOut = useCallback(async () => {
    await getBrowserClient().auth.signOut();
    setNotice(null);
  }, []);

  return (
    <EditorContext.Provider value={{ state, isEditor: state === 'editor', email, notice, signIn, signOut }}>
      {children}
      {dialog && <SignInDialog onClose={() => setDialog(false)} />}
    </EditorContext.Provider>
  );
}

export function useEditor(): EditorValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('EditorProvider חסר בעץ הרכיבים');
  return ctx;
}

/** מוצג במקום כלי עריכה למי שאינו עורך */
export function EditorGate({ children, what }: { children: React.ReactNode; what: string }) {
  const { isEditor, state, signIn } = useEditor();
  if (isEditor) return <>{children}</>;
  if (state === 'loading') return null;
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg text-sm" style={{ backgroundColor: 'var(--parchment-deep)', color: 'var(--navy-soft)' }}>
      <span>{state === 'signed-in' ? `החשבון שלך אינו מורשה ל${what}. פני ליחידת השימור להרשאה.` : `${what} זמין לעורכי יחידת השימור.`}</span>
      {state === 'guest' && (
        <button onClick={signIn} className="px-6 py-3 rounded-lg font-semibold text-white" style={{ backgroundColor: 'var(--navy)' }}>כניסה לעריכה</button>
      )}
    </div>
  );
}

/**
 * חלון כניסה לעורכים: אימייל וסיסמה (זמין תמיד), או Google כשהוא מופעל במאגר.
 * נסגר ב-X, ב-Esc, בלחיצה מחוץ לחלון, ובכפתור "חזרה לדף". הכניסה נשמרת בדפדפן עד יציאה.
 */
function SignInDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // הסיסמה גלויה כברירת מחדל, עם כפתור הסתרה
  const [showPassword, setShowPassword] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const withPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('אימייל חסר. הזיני את כתובת האימייל של חשבון העריכה.'); return; }
    if (!password) { setError('סיסמה חסרה. הזיני את הסיסמה של חשבון העריכה.'); return; }
    setBusy(true); setError(null);
    const { error: err } = await getBrowserClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) {
      setError(/invalid/i.test(err.message)
        ? 'האימייל או הסיסמה שגויים. זו אותה סיסמה של מפת אשדוד (ASHDODMAP). נסי שוב.'
        : 'הכניסה נכשלה: ' + err.message);
      return;
    }
    onClose();
  };

  const withGoogle = async () => {
    setError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY } });
      const settings = await res.json();
      if (!settings?.external?.google) {
        setError('הכניסה עם Google עדיין לא הופעלה במאגר. בינתיים היכנסי עם אימייל וסיסמה.');
        return;
      }
    } catch {
      setError('אין חיבור לשרת הכניסה. בדקי את הרשת ונסי שוב.');
      return;
    }
    const { error: err } = await getBrowserClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
    if (err) setError('הכניסה עם Google נכשלה: ' + err.message);
  };

  const field = 'w-full px-3 py-2.5 rounded-lg text-sm';
  const fieldStyle = { border: '1px solid var(--stone)', backgroundColor: 'white', color: 'var(--navy)' };

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26,20,16,0.55)' }}
      onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="signin-title" onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-[10px] p-6 space-y-4"
        style={{ backgroundColor: 'var(--surface-solid)', boxShadow: 'var(--shadow-lift)', border: '1px solid var(--hairline)' }}>
        <button onClick={onClose} aria-label="סגירה" className="absolute top-3 end-3 w-9 h-9 rounded-lg text-lg leading-none"
          style={{ color: 'var(--navy-soft)' }}>×</button>
        <div>
          <h2 id="signin-title" className="font-serif font-bold text-xl" style={{ color: 'var(--navy)' }}>כניסה לעריכה</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--navy-soft)' }}>לעורכי יחידת השימור. הכניסה נשמרת בדפדפן הזה עד שלוחצים "יציאה".</p>
        </div>
        <form onSubmit={withPassword} className="space-y-3">
          <label className="block text-sm" style={{ color: 'var(--navy)' }}>
            אימייל
            <input type="email" autoComplete="username" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} className={`${field} mt-1`} style={fieldStyle} autoFocus />
          </label>
          <div className="text-sm" style={{ color: 'var(--navy)' }}>
            <label htmlFor="signin-password">סיסמה</label>
            <div className="flex gap-2 mt-1">
              <input id="signin-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" dir="ltr" value={password}
                onChange={e => setPassword(e.target.value)} className={field} style={fieldStyle} spellCheck={false} autoCapitalize="off" />
              <button type="button" onClick={() => setShowPassword(v => !v)} aria-pressed={showPassword}
                className="shrink-0 px-3 rounded-lg text-xs whitespace-nowrap" style={{ border: '1px solid var(--stone)', color: 'var(--navy)' }}>
                {showPassword ? 'הסתרה' : 'הצגה'}
              </button>
            </div>
          </div>
          <button type="submit" disabled={busy} className="w-full px-6 py-3 rounded-lg font-semibold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--navy)' }}>
            {busy ? 'נכנסת…' : 'כניסה'}
          </button>
        </form>
        <button onClick={withGoogle} className="w-full px-6 py-3 rounded-lg text-sm font-semibold" style={{ border: '1px solid var(--stone)', color: 'var(--navy)', backgroundColor: 'white' }}>
          כניסה עם חשבון Google
        </button>
        {error && <p role="alert" className="text-sm" style={{ color: 'var(--rust)' }}>{error}</p>}
        <button onClick={onClose} className="text-sm underline" style={{ color: 'var(--navy-soft)' }}>חזרה לדף</button>
      </div>
    </div>
  );
}

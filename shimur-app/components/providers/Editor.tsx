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

  const signIn = useCallback(async () => {
    setNotice(null);
    // בדיקה מוקדמת: האם כניסה עם Google מופעלת בפרויקט
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY } });
      const settings = await res.json();
      if (!settings?.external?.google) {
        setNotice('הכניסה עם Google עדיין לא הופעלה במאגר. העריכה תיפתח מיד אחרי ההפעלה — הצפייה באתר זמינה כרגיל.');
        return;
      }
    } catch {
      setNotice('אין חיבור לשרת הכניסה. בדקי את הרשת ונסי שוב.');
      return;
    }
    const { error } = await getBrowserClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (error) setNotice('הכניסה נכשלה: ' + error.message);
  }, []);

  const signOut = useCallback(async () => {
    await getBrowserClient().auth.signOut();
    setNotice(null);
  }, []);

  return (
    <EditorContext.Provider value={{ state, isEditor: state === 'editor', email, notice, signIn, signOut }}>
      {children}
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

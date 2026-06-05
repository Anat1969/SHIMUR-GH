'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Lazy load supabase to avoid build-time issues
const LoginFormContent = dynamic(() => Promise.resolve(LoginFormImpl), {
  ssr: false,
});

function LoginFormImpl() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        router.push('/map');
      }
    } catch (err) {
      // If Supabase is not configured, show demo mode option
      setError('לא ניתן להתחבר. אנא הגדר Supabase project ו-env vars, או השתמש במצב ממחיז');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = async () => {
    // Set demo mode cookie and redirect to map
    try {
      await fetch('/api/auth/demo', { method: 'POST' });
      router.push('/map');
    } catch (err) {
      setError('שגיאה בכניסה למצב ממחיז');
    }
  };

  return (
    <form onSubmit={handleSignIn} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">
          דוא״ל
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="arch@example.com"
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ borderColor: '#EDE0CC', '--tw-ring-color': '#C8B89A' } as any}
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink mb-2">
          סיסמה
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ borderColor: '#EDE0CC' }}
          required
        />
      </div>

      {error && (
        <div className="p-4 rounded-md text-sm" style={{ backgroundColor: 'rgba(139, 58, 30, 0.1)', borderColor: '#C4582A', color: '#8B3A1E', border: '1px solid' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: loading ? '#8B7355' : '#C8B89A',
        }}
        onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#8B7355')}
        onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#C8B89A')}
      >
        {loading ? 'מתחבר...' : 'התחברות'}
      </button>

      <div className="mt-4">
        <button
          type="button"
          onClick={handleDemoMode}
          className="w-full py-2 text-center font-medium rounded-md transition-colors"
          style={{
            backgroundColor: '#EDE0CC',
            color: '#1A1410',
            border: '1px solid #C8B89A',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#DED0BB')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#EDE0CC')}
        >
          מצב ממחיז (ללא Supabase)
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, var(--ocean-pale) 0%, var(--parchment) 40%, var(--parchment-deep) 100%)' }}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-lg p-8"
        style={{ backgroundColor: 'white', borderTop: '3px solid var(--ocean)' }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/dolphin.svg" alt="" width={28} height={28} style={{ opacity: 0.7 }} />
          <h1 className="text-3xl font-serif font-bold" style={{ color: 'var(--ink)' }}>
            SHIMUR.ASHDOD
          </h1>
        </div>
        <p className="text-center text-sm mb-8" style={{ color: 'var(--ink-soft)' }}>
          מערכת ניהול מורשת בנויה
        </p>

        <LoginFormImpl />

        <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--stone-light)' }}>
          <p className="text-xs text-center" style={{ color: 'var(--ink-soft)' }}>
            גרסה 2.0 | עיריית אשדוד — יחידת שימור
          </p>
        </div>
      </div>
    </div>
  );
}

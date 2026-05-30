import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment p-4">
      <div className="text-center space-y-6">
        <div className="text-6xl font-serif font-bold text-stone-dark">404</div>
        <h1 className="text-2xl font-semibold text-ink">העמוד לא נמצא</h1>
        <p className="text-ink-soft max-w-md mx-auto">
          הדף שחיפשת לא קיים. בדוק את הכתובת או חזור לדף הבית.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/map"
            className="px-6 py-2 bg-stone text-white rounded-md hover:bg-stone-dark transition-colors"
          >
            חזרה למפה
          </Link>
          <Link
            href="/"
            className="px-6 py-2 bg-white border border-stone text-stone rounded-md hover:bg-stone-light transition-colors"
          >
            דף הבית
          </Link>
        </div>
      </div>
    </div>
  );
}

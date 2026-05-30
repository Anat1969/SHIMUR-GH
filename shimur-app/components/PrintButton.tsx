'use client';

export function PrintButton({ label = 'הדפס / שמור PDF', className }: { label?: string; className?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className={className}
      style={{ padding: '0.6rem 1.5rem', backgroundColor: '#4A5C45', color: 'white', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
    >
      {label}
    </button>
  );
}

import { Suspense } from 'react';
import { TourPlayer } from '@/components/tour/TourPlayer';

export const metadata = { title: 'סיור מודרך — מורשת אשדוד' };

export default function TourPage() {
  return (
    <Suspense fallback={<div className="h-screen" style={{ backgroundColor: 'var(--navy)' }} />}>
      <TourPlayer />
    </Suspense>
  );
}

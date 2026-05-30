'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { Building } from '@/lib/types';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';

interface FieldPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function FieldPage({ params }: FieldPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [building, setBuilding] = useState<Building | null>(null);
  const [findings, setFindings] = useState('');
  const [findingPhoto, setFindingPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    // Find building from demo data
    const found = DEMO_BUILDINGS.find(b => b.id === id);
    if (found) {
      setBuilding(found);
    }
  }, [id]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFindingPhoto(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitFinding = async () => {
    if (!findings.trim()) {
      alert('אנא הכנס תיאור הממצא');
      return;
    }

    // In demo mode, just show a success message
    alert('ממצא נשמר (מצב ממחיז - לא שמור לשרת)');
    setFindings('');
    setFindingPhoto(null);
    setPhotoPreview(null);
  };

  if (!building) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-ink-soft">המבנה לא נמצא</p>
          <Link href="/buildings" className="text-sm text-stone hover:text-stone-dark mt-4 inline-block">
            ← חזרה לרשימה
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F0E3' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-light p-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/buildings"
            className="text-sm text-stone hover:text-stone-dark inline-flex items-center gap-2 mb-3"
          >
            ← חזרה
          </Link>
          <h1 className="text-2xl font-serif font-bold text-ink">{building.name}</h1>
          <p className="text-sm text-ink-soft mt-1">{building.address}</p>
        </div>
      </div>

      {/* Building Info Card */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg border border-stone-light p-6 space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                מס׳ רישום
              </label>
              <p className="font-mono text-sm text-ink">{building.city_registry_id}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                שנת בנייה
              </label>
              <p className="text-sm text-ink">{building.year_built || '—'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                אדריכל
              </label>
              <p className="text-sm text-ink">{building.architect || '—'}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                שכונה
              </label>
              <p className="text-sm text-ink">{building.neighborhood || '—'}</p>
            </div>
          </div>
        </div>

        {/* Findings Entry Section */}
        <div className="bg-white rounded-lg border border-stone-light p-6 space-y-4">
          <h2 className="text-lg font-serif font-bold text-ink">רישום ממצא</h2>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              תיאור הממצא
            </label>
            <textarea
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="תאר את הממצא בשטח: חומר, נזק, מיקום, מידות..."
              className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2"
              style={{
                borderColor: '#EDE0CC',
                '--tw-ring-color': '#C8B89A',
              } as any}
              rows={5}
            />
          </div>

          {/* Photo Capture */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              צילום הממצא
            </label>
            <div className="border-2 border-dashed rounded-md p-6 text-center" style={{ borderColor: '#C8B89A' }}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
                id="photo-input"
              />
              <label
                htmlFor="photo-input"
                className="cursor-pointer inline-block px-6 py-2 rounded-md text-white transition-colors"
                style={{ backgroundColor: '#C8B89A' }}
              >
                צלם או בחר תמונה
              </label>
              <p className="text-xs text-ink-soft mt-2">
                {findingPhoto ? `בחר: ${findingPhoto.name}` : 'לחץ להוסיף תמונה'}
              </p>
            </div>

            {photoPreview && (
              <div className="mt-4">
                <img
                  src={photoPreview}
                  alt="preview"
                  className="w-full h-48 object-cover rounded-md border border-stone-light"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitFinding}
            className="w-full py-3 text-white font-medium rounded-md transition-colors"
            style={{ backgroundColor: '#4A5C45' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3D4A36')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4A5C45')}
          >
            שמור ממצא
          </button>

          <p className="text-xs text-ink-soft text-center italic">
            מצב ממחיז - הממצאים לא יישמרו לשרת
          </p>
        </div>
      </div>
    </div>
  );
}

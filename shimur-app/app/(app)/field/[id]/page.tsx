'use client';

import Link from 'next/link';
import { use, useEffect, useState, useCallback } from 'react';
import { Building } from '@/lib/types';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';

interface Finding {
  id: string;
  location_desc: string;
  notes: string;
  created_at: string;
  photo_url?: string | null;
}

export default function FieldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [building, setBuilding] = useState<Building | null>(null);
  const [locationDesc, setLocationDesc] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedFindings, setSavedFindings] = useState<Finding[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    const found = DEMO_BUILDINGS.find(b => b.id === id);
    if (found) setBuilding(found);
  }, [id]);

  const loadFindings = useCallback(async (registryId: string) => {
    const res = await fetch(`/api/findings?city_registry_id=${encodeURIComponent(registryId)}`);
    const data = await res.json();
    setSavedFindings(data.findings || []);
  }, []);

  useEffect(() => {
    if (building) loadFindings(building.city_registry_id);
  }, [building, loadFindings]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!locationDesc.trim()) { setError('אנא הכנס מיקום הממצא'); return; }
    if (!building) return;
    setLoading(true); setError(null); setSuccess(null);

    const formData = new FormData();
    formData.append('city_registry_id', building.city_registry_id);
    formData.append('building_name', building.name);
    formData.append('building_address', building.address);
    formData.append('location_desc', locationDesc);
    formData.append('notes', notes);
    if (photo) formData.append('photo', photo);

    const res = await fetch('/api/findings', { method: 'POST', body: formData });
    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setError(data.error);
    } else {
      setSuccess('הממצא נשמר בהצלחה');
      setLocationDesc(''); setNotes(''); setPhoto(null); setPhotoPreview(null);
      loadFindings(building.city_registry_id);
    }
  };

  if (!building) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-ink-soft">המבנה לא נמצא</p>
          <Link href="/buildings" className="text-sm mt-4 inline-block" style={{ color: '#8B7355' }}>← חזרה</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F0E3' }}>
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(26,20,16,0.92)' }}
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-10 left-0 text-white text-sm px-3 py-1 rounded"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              סגור ✕
            </button>
            <img src={lightboxUrl} alt="ממצא" className="w-full rounded-lg shadow-2xl object-contain max-h-[80vh]" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-light p-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/buildings" className="text-sm inline-flex items-center gap-2 mb-3" style={{ color: '#8B7355' }}>← חזרה</Link>
          <h1 className="text-2xl font-serif font-bold text-ink">{building.name}</h1>
          <p className="text-sm text-ink-soft mt-1">{building.address}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Building info */}
        <div className="bg-white rounded-lg border border-stone-light p-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[['מס׳ רישום', building.city_registry_id], ['שנת בנייה', building.year_built || '—'],
              ['אדריכל', building.architect || '—'], ['שכונה', building.neighborhood || '—']
            ].map(([label, val]) => (
              <div key={label as string}>
                <p className="text-xs font-semibold text-ink-soft uppercase mb-1">{label}</p>
                <p className="text-ink font-mono text-sm">{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Finding form */}
        <div className="bg-white rounded-lg border border-stone-light p-6 space-y-4">
          <h2 className="text-lg font-serif font-bold text-ink">רישום ממצא חדש</h2>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">מיקום הממצא *</label>
            <input type="text" value={locationDesc} onChange={e => setLocationDesc(e.target.value)}
              placeholder="חזית צפונית, קומה 2, פינה שמאלית..."
              className="w-full px-4 py-2 border rounded-md text-sm" style={{ borderColor: '#EDE0CC' }} />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">תיאור הממצא</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="חומר, סוג נזק, מידות, דחיפות..."
              className="w-full px-4 py-3 border rounded-md text-sm" style={{ borderColor: '#EDE0CC' }} rows={4} />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">צילום</label>
            <div className="border-2 border-dashed rounded-md p-5 text-center" style={{ borderColor: '#C8B89A' }}>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" id="photo-input" />
              <label htmlFor="photo-input" className="cursor-pointer inline-block px-6 py-2 rounded-md text-white text-sm" style={{ backgroundColor: '#C8B89A' }}>
                צלם או בחר תמונה
              </label>
              <p className="text-xs text-ink-soft mt-2">{photo ? photo.name : 'לא נבחרה תמונה'}</p>
            </div>
            {photoPreview && <img src={photoPreview} alt="preview" className="mt-3 w-full h-48 object-cover rounded-md border border-stone-light" />}
          </div>

          {error && <div className="p-3 rounded-md text-sm" style={{ backgroundColor: 'rgba(139,58,30,0.1)', color: '#8B3A1E' }}>{error}</div>}
          {success && <div className="p-3 rounded-md text-sm" style={{ backgroundColor: 'rgba(74,92,69,0.1)', color: '#4A5C45' }}>✓ {success}</div>}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3 text-white font-medium rounded-md transition-colors disabled:opacity-60"
            style={{ backgroundColor: '#4A5C45' }}>
            {loading ? 'שומר...' : 'שמור ממצא'}
          </button>
        </div>

        {/* Saved findings */}
        {savedFindings.length > 0 && (
          <div className="bg-white rounded-lg border border-stone-light p-5">
            <h3 className="text-sm font-semibold text-ink-soft uppercase mb-3">ממצאים שנשמרו ({savedFindings.length})</h3>
            <div className="space-y-3">
              {savedFindings.map(f => (
                <div key={f.id} className="flex gap-3 p-3 rounded-md" style={{ backgroundColor: '#F7F0E3' }}>
                  {f.photo_url && (
                    <button onClick={() => setLightboxUrl(f.photo_url!)} className="flex-shrink-0">
                      <img src={f.photo_url} alt="ממצא"
                        className="w-16 h-16 object-cover rounded-md border border-stone-light hover:opacity-80 transition-opacity"
                        style={{ minWidth: 64 }} />
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink text-sm">{f.location_desc}</p>
                    {f.notes && <p className="text-ink-soft text-sm mt-1">{f.notes}</p>}
                    <p className="text-xs text-ink-soft mt-1">{new Date(f.created_at).toLocaleString('he-IL')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

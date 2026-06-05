'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';

interface Doc {
  id: string;
  title: string;
  url?: string;
  type: 'link' | 'note';
  building_id?: string;
  created_at: string;
  note?: string;
}

interface Photo {
  id: string;
  name: string;
  description: string;
  url: string;
  building_id?: string;
  created_at: string;
}

const DOCS_KEY = 'shimur_documents';
const PHOTOS_KEY = 'shimur_photos';

function loadData<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); }
  catch { return []; }
}

function saveData<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', building_id: '', note: '', type: 'link' as 'link' | 'note' });
  const [photoForm, setPhotoForm] = useState({ name: '', description: '', url: '', building_id: '' });
  const [filter, setFilter] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [tab, setTab] = useState<'docs' | 'gallery'>('docs');
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  useEffect(() => {
    setDocs(loadData<Doc>(DOCS_KEY));
    setPhotos(loadData<Photo>(PHOTOS_KEY));
  }, []);

  const saveDoc = () => {
    if (!form.title.trim()) return;
    const newDocs = editId
      ? docs.map(d => d.id === editId ? { ...d, ...form } : d)
      : [...docs, { ...form, id: Date.now().toString(), created_at: new Date().toISOString() }];
    setDocs(newDocs);
    saveData(DOCS_KEY, newDocs);
    setForm({ title: '', url: '', building_id: '', note: '', type: 'link' });
    setShowForm(false);
    setEditId(null);
  };

  const removeDoc = (id: string) => {
    const newDocs = docs.filter(d => d.id !== id);
    setDocs(newDocs);
    saveData(DOCS_KEY, newDocs);
  };

  const startEdit = (doc: Doc) => {
    setForm({ title: doc.title, url: doc.url ?? '', building_id: doc.building_id ?? '', note: doc.note ?? '', type: doc.type });
    setEditId(doc.id);
    setShowForm(true);
  };

  const savePhoto = useCallback(() => {
    if (!photoForm.name.trim() || !photoForm.url.trim()) return;
    const newPhoto: Photo = {
      id: Date.now().toString(),
      ...photoForm,
      created_at: new Date().toISOString(),
    };
    const updated = [...photos, newPhoto];
    setPhotos(updated);
    saveData(PHOTOS_KEY, updated);
    setPhotoForm({ name: '', description: '', url: '', building_id: '' });
    setShowPhotoForm(false);
  }, [photoForm, photos]);

  const removePhoto = (id: string) => {
    const updated = photos.filter(p => p.id !== id);
    setPhotos(updated);
    saveData(PHOTOS_KEY, updated);
  };

  const filtered = docs.filter(d =>
    (!filter || d.building_id === filter) &&
    (d.title || d.url || d.note)
  );

  const filteredPhotos = photos.filter(p =>
    !filter || p.building_id === filter
  );

  const getBuildingName = (id: string) => DEMO_BUILDINGS.find(b => b.id === id)?.name ?? '';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="page-intro">
        <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: 'var(--navy)' }}>
          מסמכים, קישורים וגלריה
        </h1>
        <p style={{ color: 'var(--navy-soft)' }}>
          מאגר מידע מרכזי לכל אתר — <span className="highlight-text">מסמכים</span>, קישורים, הערות
          ו<span className="highlight-text">תמונות</span>. כל תוכן שנשמר זמין מיידית.
          תיעוד מלא הוא הבסיס לכל תהליך שימור — צלם, רשום, שמור.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('docs')}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === 'docs' ? 'var(--navy)' : 'var(--parchment-deep)',
              color: tab === 'docs' ? 'white' : 'var(--navy)',
            }}
          >
            מסמכים ({docs.length})
          </button>
          <button
            onClick={() => setTab('gallery')}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === 'gallery' ? 'var(--ocean)' : 'var(--ocean-pale)',
              color: tab === 'gallery' ? 'white' : 'var(--ocean-dark)',
            }}
          >
            גלריה ({photos.length})
          </button>
        </div>

        {tab === 'docs' ? (
          <button onClick={() => { setShowForm(s => !s); setEditId(null); setForm({ title: '', url: '', building_id: '', note: '', type: 'link' }); }}
            className="px-5 py-2 text-white font-medium rounded-lg text-sm"
            style={{ backgroundColor: 'var(--sage)' }}>
            {showForm ? '× ביטול' : '+ הוסף מסמך'}
          </button>
        ) : (
          <button onClick={() => setShowPhotoForm(s => !s)}
            className="px-5 py-2 text-white font-medium rounded-lg text-sm"
            style={{ backgroundColor: 'var(--ocean)' }}>
            {showPhotoForm ? '× ביטול' : '+ הוסף תמונה'}
          </button>
        )}
      </div>

      {/* Filter */}
      {(docs.length > 0 || photos.length > 0) && (
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm max-w-xs"
          style={{ border: '1px solid var(--stone-light)', color: 'var(--navy)', backgroundColor: 'white' }}>
          <option value="">כל האתרים</option>
          {DEMO_BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}

      {/* === DOCUMENTS TAB === */}
      {tab === 'docs' && (
        <>
          {showForm && (
            <div className="glass-card p-6 space-y-4" style={{ borderTop: '3px solid var(--sage)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--navy)' }}>{editId ? 'עריכת מסמך' : 'הוספת מסמך חדש'}</h2>
              <div className="flex gap-2">
                {(['link', 'note'] as const).map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    className="px-3 py-1.5 rounded text-sm transition-colors"
                    style={{
                      border: `1px solid ${form.type === t ? 'var(--sage)' : 'var(--stone-light)'}`,
                      backgroundColor: form.type === t ? 'var(--sage)' : 'white',
                      color: form.type === t ? 'white' : 'var(--navy)',
                    }}>
                    {t === 'link' ? 'קישור / URL' : 'הערה'}
                  </button>
                ))}
              </div>
              <div className="grid gap-3">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="כותרת המסמך *"
                  className="w-full px-4 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--stone-light)', color: 'var(--navy)' }} />
                {form.type === 'link' && (
                  <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-2 rounded-lg text-sm font-mono"
                    style={{ border: '1px solid var(--stone-light)', color: 'var(--navy)' }} />
                )}
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="הערות / תיאור" rows={3}
                  className="w-full px-4 py-2 rounded-lg text-sm resize-none"
                  style={{ border: '1px solid var(--stone-light)', color: 'var(--navy)' }} />
                <select value={form.building_id} onChange={e => setForm(f => ({ ...f, building_id: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--stone-light)', color: 'var(--navy)' }}>
                  <option value="">כל האתרים</option>
                  {DEMO_BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.city_registry_id} — {b.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={saveDoc}
                  className="px-6 py-2 text-white font-medium rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--sage)' }}>
                  {editId ? 'עדכן' : 'שמור'}
                </button>
                <button onClick={() => { setShowForm(false); setEditId(null); }}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--stone-light)', color: 'var(--navy-soft)' }}>
                  ביטול
                </button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16 glass-card">
              <p className="text-4xl mb-3">📄</p>
              <p style={{ color: 'var(--navy-soft)' }}>אין מסמכים עדיין</p>
              <p className="text-sm mt-1" style={{ color: 'var(--navy-soft)' }}>לחץ "+ הוסף מסמך" כדי להתחיל</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(doc => (
                <div key={doc.id} className="glass-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded"
                          style={{ backgroundColor: 'var(--parchment-deep)', color: 'var(--navy-soft)' }}>
                          {doc.type === 'link' ? 'קישור' : 'הערה'}
                        </span>
                        {doc.building_id && (
                          <Link href={`/buildings/${doc.building_id}`}
                            className="text-xs px-2 py-0.5 rounded hover:opacity-80"
                            style={{ backgroundColor: 'var(--ocean-pale)', color: 'var(--ocean-dark)' }}>
                            {getBuildingName(doc.building_id)}
                          </Link>
                        )}
                      </div>
                      <p className="font-medium" style={{ color: 'var(--navy)' }}>{doc.title}</p>
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="text-sm break-all hover:underline" style={{ color: 'var(--ocean)' }}>
                          {doc.url}
                        </a>
                      )}
                      {doc.note && <p className="text-sm mt-1" style={{ color: 'var(--navy-soft)' }}>{doc.note}</p>}
                      <p className="text-xs mt-2" style={{ color: 'var(--navy-soft)' }}>
                        {new Date(doc.created_at).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEdit(doc)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ border: '1px solid var(--stone-light)', color: 'var(--navy-soft)' }}>
                        ערוך
                      </button>
                      <button onClick={() => removeDoc(doc.id)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ border: '1px solid var(--stone-light)', color: 'var(--rust)' }}>
                        מחק
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* === GALLERY TAB === */}
      {tab === 'gallery' && (
        <>
          {showPhotoForm && (
            <div className="glass-card p-6 space-y-4" style={{ borderTop: '3px solid var(--ocean)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--navy)' }}>הוספת תמונה</h2>
              <div className="grid gap-3">
                <input value={photoForm.url} onChange={e => setPhotoForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="קישור לתמונה (URL) *"
                  className="w-full px-4 py-2 rounded-lg text-sm font-mono"
                  style={{ border: '1px solid var(--ocean-light)', color: 'var(--navy)' }} />
                <input value={photoForm.name} onChange={e => setPhotoForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="שם התמונה *"
                  className="w-full px-4 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--ocean-light)', color: 'var(--navy)' }} />
                <textarea value={photoForm.description} onChange={e => setPhotoForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="תיאור — כיוון צילום, פרטים, תאריך..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg text-sm resize-none"
                  style={{ border: '1px solid var(--ocean-light)', color: 'var(--navy)' }} />
                <select value={photoForm.building_id} onChange={e => setPhotoForm(f => ({ ...f, building_id: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--ocean-light)', color: 'var(--navy)' }}>
                  <option value="">ללא שיוך לאתר</option>
                  {DEMO_BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.city_registry_id} — {b.name}</option>)}
                </select>
              </div>
              <button onClick={savePhoto}
                disabled={!photoForm.name.trim() || !photoForm.url.trim()}
                className="px-6 py-2 text-white font-medium rounded-lg text-sm disabled:opacity-40"
                style={{ backgroundColor: 'var(--ocean)' }}>
                שמור תמונה
              </button>
            </div>
          )}

          {filteredPhotos.length === 0 ? (
            <div className="text-center py-16 glass-card">
              <p className="text-4xl mb-3">📷</p>
              <p style={{ color: 'var(--navy-soft)' }}>אין תמונות עדיין</p>
              <p className="text-sm mt-1" style={{ color: 'var(--navy-soft)' }}>לחץ "+ הוסף תמונה" כדי להתחיל</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredPhotos.map(photo => (
                <div key={photo.id} className="glass-card overflow-hidden group">
                  <button
                    onClick={() => setLightbox(photo)}
                    className="w-full aspect-[4/3] relative overflow-hidden"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect fill="%23E8F4F7" width="200" height="150"/><text x="100" y="80" text-anchor="middle" fill="%231B6B7D" font-size="14">תמונה</text></svg>'; }}
                    />
                  </button>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--navy)' }}>{photo.name}</p>
                    {photo.description && (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--navy-soft)' }}>{photo.description}</p>
                    )}
                    {photo.building_id && (
                      <Link href={`/buildings/${photo.building_id}`}
                        className="text-xs mt-1 inline-block"
                        style={{ color: 'var(--ocean)' }}>
                        {getBuildingName(photo.building_id)}
                      </Link>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs" style={{ color: 'var(--navy-soft)' }}>
                        {new Date(photo.created_at).toLocaleDateString('he-IL')}
                      </span>
                      <button onClick={() => removePhoto(photo.id)}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ color: 'var(--rust)' }}>
                        מחק
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lightbox */}
          {lightbox && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(27, 42, 74, 0.85)' }}
              onClick={() => setLightbox(null)}
            >
              <div
                className="max-w-3xl w-full rounded-xl overflow-hidden shadow-2xl"
                style={{ backgroundColor: 'white' }}
                onClick={e => e.stopPropagation()}
              >
                <img
                  src={lightbox.url}
                  alt={lightbox.name}
                  className="w-full max-h-[60vh] object-contain"
                  style={{ backgroundColor: 'var(--navy)' }}
                />
                <div className="p-5">
                  <h3 className="font-serif font-bold text-lg" style={{ color: 'var(--navy)' }}>
                    {lightbox.name}
                  </h3>
                  {lightbox.description && (
                    <p className="text-sm mt-1" style={{ color: 'var(--navy-soft)' }}>
                      {lightbox.description}
                    </p>
                  )}
                  {lightbox.building_id && (
                    <Link href={`/buildings/${lightbox.building_id}`}
                      className="text-sm mt-2 inline-block"
                      style={{ color: 'var(--ocean)' }}>
                      {getBuildingName(lightbox.building_id)} →
                    </Link>
                  )}
                  <button
                    onClick={() => setLightbox(null)}
                    className="mt-4 block px-4 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: 'var(--parchment-deep)', color: 'var(--navy)' }}
                  >
                    סגור
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

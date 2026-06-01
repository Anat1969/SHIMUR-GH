'use client';

import { useState, useEffect } from 'react';
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

const STORAGE_KEY = 'shimur_documents';

function loadDocs(): Doc[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch { return []; }
}

function saveDocs(docs: Doc[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', building_id: '', note: '', type: 'link' as 'link' | 'note' });
  const [filter, setFilter] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { setDocs(loadDocs()); }, []);

  const save = () => {
    if (!form.title.trim()) return;
    const newDocs = editId
      ? docs.map(d => d.id === editId ? { ...d, ...form } : d)
      : [...docs, { ...form, id: Date.now().toString(), created_at: new Date().toISOString() }];
    setDocs(newDocs);
    saveDocs(newDocs);
    setForm({ title: '', url: '', building_id: '', note: '', type: 'link' });
    setShowForm(false);
    setEditId(null);
  };

  const remove = (id: string) => {
    const newDocs = docs.filter(d => d.id !== id);
    setDocs(newDocs);
    saveDocs(newDocs);
  };

  const startEdit = (doc: Doc) => {
    setForm({ title: doc.title, url: doc.url ?? '', building_id: doc.building_id ?? '', note: doc.note ?? '', type: doc.type });
    setEditId(doc.id);
    setShowForm(true);
  };

  const filtered = docs.filter(d =>
    (!filter || d.building_id === filter) &&
    (d.title || d.url || d.note)
  );

  const getBuildingName = (id: string) => DEMO_BUILDINGS.find(b => b.id === id)?.name ?? '';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink mb-1">מסמכים וקישורים</h1>
          <p className="text-ink-soft">שמירת קישורים ומסמכים הקשורים לאתרי השימור</p>
        </div>
        <button onClick={() => { setShowForm(s => !s); setEditId(null); setForm({ title: '', url: '', building_id: '', note: '', type: 'link' }); }}
          className="px-5 py-2.5 text-white font-medium rounded-lg text-sm"
          style={{ backgroundColor: '#4A5C45' }}>
          {showForm ? '× ביטול' : '+ הוסף מסמך'}
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-white rounded-xl border-2 p-6 space-y-4" style={{ borderColor: '#C8B89A' }}>
          <h2 className="font-semibold text-ink">{editId ? 'עריכת מסמך' : 'הוספת מסמך חדש'}</h2>

          <div className="flex gap-2">
            {(['link', 'note'] as const).map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                className="px-3 py-1.5 rounded text-sm border transition-colors"
                style={{ borderColor: form.type === t ? '#4A5C45' : '#EDE0CC', backgroundColor: form.type === t ? '#4A5C45' : 'white', color: form.type === t ? 'white' : '#3D3228' }}>
                {t === 'link' ? 'קישור / URL' : 'הערה'}
              </button>
            ))}
          </div>

          <div className="grid gap-3">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="כותרת המסמך *"
              className="w-full px-4 py-2 border rounded-lg text-sm" style={{ borderColor: '#EDE0CC' }} />

            {form.type === 'link' && (
              <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-2 border rounded-lg text-sm font-mono" style={{ borderColor: '#EDE0CC' }} />
            )}

            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="הערות / תיאור"
              rows={3}
              className="w-full px-4 py-2 border rounded-lg text-sm resize-none" style={{ borderColor: '#EDE0CC' }} />

            <select value={form.building_id} onChange={e => setForm(f => ({ ...f, building_id: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg text-sm" style={{ borderColor: '#EDE0CC' }}>
              <option value="">כל האתרים</option>
              {DEMO_BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.city_registry_id} — {b.name}</option>)}
            </select>
          </div>

          <div className="flex gap-3">
            <button onClick={save}
              className="px-6 py-2 text-white font-medium rounded-lg text-sm"
              style={{ backgroundColor: '#4A5C45' }}>
              {editId ? 'עדכן' : 'שמור'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }}
              className="px-4 py-2 border rounded-lg text-sm" style={{ borderColor: '#EDE0CC', color: '#8B7355' }}>
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      {docs.length > 0 && (
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm max-w-xs" style={{ borderColor: '#EDE0CC' }}>
          <option value="">כל האתרים</option>
          {DEMO_BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}

      {/* Documents list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-ink-soft">
          <p className="text-4xl mb-3">📄</p>
          <p>אין מסמכים עדיין</p>
          <p className="text-sm mt-1">לחץ "+ הוסף מסמך" כדי להתחיל</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-stone-light p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#EDE3D0', color: '#8B7355' }}>
                      {doc.type === 'link' ? 'קישור' : 'הערה'}
                    </span>
                    {doc.building_id && (
                      <Link href={`/buildings/${doc.building_id}`}
                        className="text-xs px-2 py-0.5 rounded hover:opacity-80" style={{ backgroundColor: '#F0F7F0', color: '#4A5C45' }}>
                        {getBuildingName(doc.building_id)}
                      </Link>
                    )}
                  </div>
                  <p className="font-medium text-ink">{doc.title}</p>
                  {doc.url && (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm break-all hover:underline" style={{ color: '#4A5C45' }}>
                      {doc.url}
                    </a>
                  )}
                  {doc.note && <p className="text-sm text-ink-soft mt-1">{doc.note}</p>}
                  <p className="text-xs text-ink-soft mt-2">{new Date(doc.created_at).toLocaleDateString('he-IL')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(doc)}
                    className="text-xs px-2 py-1 rounded border" style={{ borderColor: '#EDE0CC', color: '#8B7355' }}>
                    ערוך
                  </button>
                  <button onClick={() => remove(doc.id)}
                    className="text-xs px-2 py-1 rounded border" style={{ borderColor: '#EDE0CC', color: '#8B3A1E' }}>
                    מחק
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

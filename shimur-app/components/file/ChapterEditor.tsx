'use client';

import { useState, useEffect, useRef } from 'react';

interface ChapterEditorProps {
  fields: string[];
  initialContent: Record<string, string>;
  cityRegistryId: string;
  buildingName: string;
  buildingAddress: string;
  chapterKey: string;
  chapterTitle: string;
}

export function ChapterEditor({
  fields, initialContent, cityRegistryId, buildingName, buildingAddress, chapterKey, chapterTitle
}: ChapterEditorProps) {
  const [content, setContent] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    fields.forEach(f => { base[f] = initialContent[f] ?? ''; });
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = async (data: Record<string, string>) => {
    setSaving(true); setError(null); setSaved(false);
    const res = await fetch('/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city_registry_id: cityRegistryId, building_name: buildingName, building_address: buildingAddress, chapter_key: chapterKey, chapter_title: chapterTitle, content: data }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.error) setError(json.error);
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };

  const handleChange = (field: string, value: string) => {
    const next = { ...content, [field]: value };
    setContent(next);
    // Auto-save debounce 2s
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(next), 2000);
  };

  const filledCount = Object.values(content).filter(v => v?.trim()).length;
  const pct = fields.length > 0 ? Math.round((filledCount / fields.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-white rounded-lg border border-stone-light p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-ink-soft">השלמת הפרק</span>
          <span className="font-medium text-ink">{pct}%</span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#EDE0CC' }}>
          <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#4A5C45' : '#C8B89A' }} />
        </div>
        <p className="text-xs text-ink-soft mt-1">{filledCount} מתוך {fields.length} שדות מולאו</p>
      </div>

      {/* Fields */}
      <div className="bg-white rounded-lg border border-stone-light p-6 space-y-5">
        {fields.map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-ink mb-2">{field}</label>
            <textarea
              value={content[field] ?? ''}
              onChange={e => handleChange(field, e.target.value)}
              placeholder={`הכנס ${field}...`}
              rows={3}
              className="w-full px-4 py-3 border rounded-md text-sm resize-y"
              style={{ borderColor: content[field]?.trim() ? '#4A5C45' : '#EDE0CC', outline: 'none' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#C8B89A')}
              onBlur={e => (e.currentTarget.style.borderColor = content[field]?.trim() ? '#4A5C45' : '#EDE0CC')}
            />
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => save(content)}
          disabled={saving}
          className="px-8 py-3 text-white font-medium rounded-md transition-colors disabled:opacity-60"
          style={{ backgroundColor: '#4A5C45' }}
        >
          {saving ? 'שומר...' : 'שמור פרק'}
        </button>
        {saved && <span className="text-sm" style={{ color: '#4A5C45' }}>✓ נשמר בהצלחה</span>}
        {error && <span className="text-sm" style={{ color: '#8B3A1E' }}>שגיאה: {error}</span>}
        <span className="text-xs text-ink-soft mr-auto">שמירה אוטומטית אחרי 2 שניות</span>
      </div>
    </div>
  );
}

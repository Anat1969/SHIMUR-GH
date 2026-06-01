interface ConfigBannerProps {
  type: 'registration' | 'file' | 'card' | 'print' | 'field';
}

const CONFIG: Record<ConfigBannerProps['type'], { icon: string; title: string; desc: string; color: string }> = {
  registration: {
    icon: '📋',
    title: 'כרטיס רישום',
    desc: 'נתוני בסיס: זיהוי, מיקום, בעלות, מקורות ממשלתיים. נקודת הפתיחה לכל עבודה על האתר.',
    color: '#8B7355',
  },
  file: {
    icon: '📁',
    title: 'תיק תיעוד',
    desc: '9 פרקים לפי תקן ICOMOS — נמצא בתהליך עריכה שוטפת בשטח ובסטודיו. שמירה אוטומטית בכל עריכה.',
    color: '#4A5C45',
  },
  card: {
    icon: '🗂',
    title: 'כרטסת תיק',
    desc: 'סקירה רציפה של כל החומר שנאסף — טקסטואלי וויזואלי. מיועדת לסקירה פנימית ולהצגה בפגישות.',
    color: '#8B3A1E',
  },
  print: {
    icon: '🖨',
    title: 'הדפסה / PDF',
    desc: 'פריסת A4 של כל פרקי התיק. לשמירה כ-PDF להגשה רשמית לוועדה המקומית.',
    color: '#3D3228',
  },
  field: {
    icon: '📍',
    title: 'תיעוד שטח',
    desc: 'ממשק מובייל לרישום ממצאים בזמן אמת בשטח — צילום, מיקום, תיאור. נשמר מיד ל-Supabase.',
    color: '#4A5C45',
  },
};

export function ConfigBanner({ type }: ConfigBannerProps) {
  const c = CONFIG[type];
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-lg text-sm mb-4"
      style={{ backgroundColor: `${c.color}10`, border: `1px solid ${c.color}30` }}>
      <span className="text-lg">{c.icon}</span>
      <div>
        <span className="font-semibold" style={{ color: c.color }}>{c.title}</span>
        <span className="text-ink-soft mr-2">—</span>
        <span className="text-ink-soft">{c.desc}</span>
      </div>
    </div>
  );
}

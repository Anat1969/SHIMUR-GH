/**
 * טקסט ארוך, משפט בשורה: ירידת שורה אחרי כל נקודה, כך שקל לקרוא ולהציג מול קהל.
 * טקסט קצר (משפט אחד) מוצג כמו שהוא.
 */
export function Sentences({ text }: { text: string }) {
  // חיתוך אחרי נקודה, סימן שאלה או קריאה שאחריהם רווח. "1.5" או "ה-60." בסוף לא נחתכים באמצע.
  const parts = text.split(/(?<=[.!?])\s+(?=\S)/).map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) return <>{text}</>;
  return <>{parts.map((s, i) => <span key={i} className="block mt-1.5 first:mt-0">{s}</span>)}</>;
}

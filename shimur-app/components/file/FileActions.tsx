'use client';

interface FileActionsProps {
  buildingId: string;
  buildingName: string;
  cityRegistryId: string;
  firstChapterId: string;
}

export function FileActions({ buildingId, buildingName, cityRegistryId, firstChapterId }: FileActionsProps) {
  const handlePrint = () => {
    window.open(`/buildings/${buildingId}/file/print`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`תיק תיעוד: ${buildingName} (${cityRegistryId})`);
    const body = encodeURIComponent(
      `שלום,\n\nמצורף קישור לתיק התיעוד של המבנה:\n${buildingName}\nמס׳ רישום: ${cityRegistryId}\n\nלצפייה בתיק:\n${window.location.origin}/buildings/${buildingId}/file\n\nלצפייה בכרטסת:\n${window.location.origin}/buildings/${buildingId}/card\n\nבברכה`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="flex gap-3 flex-wrap pt-2 border-t border-stone-light">
      <a
        href={`/buildings/${buildingId}/file/${firstChapterId}`}
        className="px-6 py-3 font-medium rounded-md text-sm border transition-colors"
        style={{ backgroundColor: 'white', color: '#8B7355', borderColor: '#C8B89A' }}
      >
        ערוך תיק
      </a>
      <button
        onClick={handlePrint}
        className="px-6 py-3 text-white font-medium rounded-md text-sm transition-colors"
        style={{ backgroundColor: '#8B7355' }}
      >
        הדפסה / PDF
      </button>
      <button
        onClick={handleEmail}
        className="px-6 py-3 font-medium rounded-md text-sm border transition-colors"
        style={{ backgroundColor: 'white', color: '#4A5C45', borderColor: '#4A5C45' }}
      >
        שלח במייל
      </button>
    </div>
  );
}

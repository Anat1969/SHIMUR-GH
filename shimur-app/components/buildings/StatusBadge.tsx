import { BuildingStatus, STATUS_COLORS, STATUS_LABELS } from '@/lib/types';

interface StatusBadgeProps {
  status: BuildingStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}

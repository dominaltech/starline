import React from 'react';
import { JobStatus } from '../../types';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface JobStatusBadgeProps {
  status: JobStatus;
  onChange?: (status: JobStatus) => void;
  editable?: boolean;
}

export const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ status, onChange, editable = false }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'WORK_DONE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'WORK_DONE':
        return 'Work Done';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'WORK_DONE':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'IN_PROGRESS':
        return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      case 'CANCELLED':
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
    }
  };

  if (editable && onChange) {
    return (
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as JobStatus)}
        className={`text-xs font-semibold px-2 py-1 rounded border cursor-pointer ${getBadgeStyle()}`}
      >
        <option value="WORK_DONE">Work Done</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded border ${getBadgeStyle()}`}>
      {getIcon()}
      <span>{getLabel()}</span>
    </span>
  );
};

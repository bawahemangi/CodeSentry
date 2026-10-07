import React from 'react';
import { AlertCircle, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

export const SeverityBadge = ({ severity }) => {
  const norm = (severity || '').toLowerCase();

  switch (norm) {
    case 'critical':
      return (
        <span className="badge badge-danger">
          <ShieldAlert size={12} />
          Critical
        </span>
      );
    case 'high':
      return (
        <span className="badge" style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
          <AlertCircle size={12} />
          High
        </span>
      );
    case 'medium':
    case 'warning':
      return (
        <span className="badge badge-warning">
          <AlertTriangle size={12} />
          Medium
        </span>
      );
    case 'low':
    case 'suggestion':
    case 'info':
    default:
      return (
        <span className="badge badge-info">
          <Info size={12} />
          Low
        </span>
      );
  }
};

export default SeverityBadge;

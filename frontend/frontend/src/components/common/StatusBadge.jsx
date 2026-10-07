import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, GitPullRequest, Eye } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const norm = (status || '').toLowerCase().replace(/_/g, ' ');

  if (norm.includes('approve')) {
    return (
      <span className="badge badge-success">
        <CheckCircle2 size={13} />
        Approved
      </span>
    );
  }

  if (norm.includes('request') || norm.includes('changes')) {
    return (
      <span className="badge badge-warning">
        <AlertTriangle size={13} />
        Changes Requested
      </span>
    );
  }

  if (norm.includes('comment')) {
    return (
      <span className="badge badge-info">
        <Eye size={13} />
        Commented
      </span>
    );
  }

  if (norm.includes('complet')) {
    return (
      <span className="badge badge-success">
        <CheckCircle2 size={13} />
        Completed
      </span>
    );
  }

  if (norm.includes('analyz') || norm.includes('run')) {
    return (
      <span className="badge badge-purple">
        <span className="pulse-dot" style={{ width: '6px', height: '6px' }}></span>
        Analyzing
      </span>
    );
  }

  if (norm.includes('queue') || norm.includes('pend')) {
    return (
      <span className="badge badge-neutral">
        <Clock size={13} />
        Queued
      </span>
    );
  }

  if (norm.includes('fail') || norm.includes('error')) {
    return (
      <span className="badge badge-danger">
        <XCircle size={13} />
        Failed
      </span>
    );
  }

  return <span className="badge badge-neutral">{status}</span>;
};

export default StatusBadge;

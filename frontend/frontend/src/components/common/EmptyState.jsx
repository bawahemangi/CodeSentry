import React from 'react';
import { FolderGit2, GitPullRequest, CheckCircle2, Search, ArrowRight } from 'lucide-react';

export const EmptyState = ({
  icon: CustomIcon,
  title = 'No records found',
  description = 'There is no data to display for the current filter criteria.',
  actionLabel,
  onAction,
  type = 'default',
}) => {
  let Icon = CustomIcon || Search;

  if (!CustomIcon) {
    if (type === 'repos') Icon = FolderGit2;
    if (type === 'prs') Icon = GitPullRequest;
    if (type === 'clean') Icon = CheckCircle2;
  }

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={28} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-text">{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
};

export default EmptyState;

import React from 'react';
import { GitPullRequest, Radio, Clock, GitBranch, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';

export const ReviewPipeline = ({ currentStatus = 'Completed', stages = [] }) => {
  const defaultStages = [
    { name: 'PR Created', icon: GitPullRequest, step: 1 },
    { name: 'Webhook Received', icon: Radio, step: 2 },
    { name: 'Queued (Celery)', icon: Clock, step: 3 },
    { name: 'Tree-sitter AST', icon: GitBranch, step: 4 },
    { name: 'Gemini 2.5 Flash', icon: Sparkles, step: 5 },
    { name: 'Review Completed', icon: CheckCircle2, step: 6 },
    { name: 'GitHub Commented', icon: MessageSquare, step: 7 },
  ];

  const pipeline = stages.length > 0 ? stages : defaultStages;

  return (
    <div className="table-card" style={{ marginBottom: '1.75rem' }}>
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Processing Pipeline
          </span>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
            Automated Review Workflow
          </h3>
        </div>
        <span className="badge badge-success">
          <CheckCircle2 size={13} />
          {currentStatus}
        </span>
      </div>

      <div className="pipeline-track" style={{ border: 'none', margin: 0 }}>
        {pipeline.map((stage, idx) => {
          const isCompleted = true; // For completed reviews
          const isLast = idx === pipeline.length - 1;
          const Icon = stage.icon || CheckCircle2;

          return (
            <React.Fragment key={idx}>
              <div className={`pipeline-step ${isCompleted ? 'completed' : ''}`}>
                <div className="pipeline-step-circle">
                  <Icon size={18} />
                </div>
                <div className="pipeline-step-title">{stage.name || stage.step}</div>
                {stage.time && (
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{stage.time}</div>
                )}
              </div>
              {!isLast && <div className={`pipeline-connector ${isCompleted ? 'completed' : ''}`}></div>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewPipeline;

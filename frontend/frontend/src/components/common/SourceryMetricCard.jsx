import React from 'react';
import { Check, Plus, Clock, Ban, Sparkles, ShieldCheck } from 'lucide-react';

export const SourceryMetricCard = ({ type, data }) => {
  if (type === 'issues-breakdown') {
    return (
      <div className="sourcery-card">
        <div className="sourcery-icon-bubble green">
          <Check size={22} strokeWidth={2.5} />
        </div>
        <div className="sourcery-card-body">
          <div className="sourcery-breakdown-row">
            <span>
              <span className="sourcery-dot red"></span>
              {data.critical || 0} critical
            </span>
            <span>
              <span className="sourcery-dot amber"></span>
              {data.high || 0} high
            </span>
          </div>
          <div className="sourcery-breakdown-row">
            <span>
              <span className="sourcery-dot cyan"></span>
              {data.medium || 0} medium
            </span>
            <span>
              <span className="sourcery-dot slate"></span>
              {data.low || 0} low
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'new-groups') {
    return (
      <div className="sourcery-card">
        <div className="sourcery-icon-bubble blue">
          <Plus size={22} strokeWidth={2.5} />
        </div>
        <div className="sourcery-card-body">
          <div className="sourcery-single-title">{data.count || 0} active reviews</div>
          <div className="sourcery-single-sub">in last 7 days</div>
        </div>
      </div>
    );
  }

  if (type === 'ast-signals') {
    return (
      <div className="sourcery-card">
        <div className="sourcery-icon-bubble amber">
          <ShieldCheck size={22} strokeWidth={2.5} />
        </div>
        <div className="sourcery-card-body">
          <div className="sourcery-single-title">{data.astCount || 18} AST signals checked</div>
          <div className="sourcery-single-sub">Tree-sitter static validation</div>
        </div>
      </div>
    );
  }

  if (type === 'ai-accuracy') {
    return (
      <div className="sourcery-card">
        <div className="sourcery-icon-bubble purple">
          <Sparkles size={22} strokeWidth={2.5} />
        </div>
        <div className="sourcery-card-body">
          <div className="sourcery-single-title">{data.accuracy || '94.6%'} clean code score</div>
          <div className="sourcery-single-sub">Gemini LLM model verdict</div>
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="sourcery-card">
      <div className="sourcery-icon-bubble slate">
        <Ban size={22} strokeWidth={2.5} />
      </div>
      <div className="sourcery-card-body">
        <div className="sourcery-single-title">0 ignored items</div>
        <div className="sourcery-single-sub">in last 7 days</div>
      </div>
    </div>
  );
};

export default SourceryMetricCard;

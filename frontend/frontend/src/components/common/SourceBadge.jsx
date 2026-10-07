import React from 'react';
import { GitBranch, Sparkles, Layers } from 'lucide-react';

export const SourceBadge = ({ source }) => {
  const norm = (source || '').toUpperCase();

  if (norm === 'BOTH' || norm.includes('HYBRID')) {
    return (
      <span
        className="badge"
        style={{
          backgroundColor: '#f5f3ff',
          color: '#6d28d9',
          border: '1px solid #ddd6fe',
        }}
        title="Detected by both Tree-sitter AST Static Parser & Google Gemini LLM"
      >
        <Layers size={12} />
        Hybrid (AST + AI)
      </span>
    );
  }

  if (norm === 'AST' || norm.includes('TREE-SITTER')) {
    return (
      <span
        className="badge"
        style={{
          backgroundColor: '#eff6ff',
          color: '#1d4ed8',
          border: '1px solid #bfdbfe',
        }}
        title="Detected deterministically by Tree-sitter AST syntax and grammar checker"
      >
        <GitBranch size={12} />
        Tree-sitter AST
      </span>
    );
  }

  // AI / LLM default
  return (
    <span
      className="badge"
      style={{
        backgroundColor: '#faf5ff',
        color: '#7e22ce',
        border: '1px solid #e9d5ff',
      }}
      title="Synthesized and evaluated by Google Gemini LLM analysis"
    >
      <Sparkles size={12} />
      Gemini AI
    </span>
  );
};

export default SourceBadge;

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export const StatCard = ({ label, value, icon: Icon, trend, trendType = 'up', subtext }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <div className="stat-card-icon-wrap">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="stat-card-value">{value}</div>

      {(trend || subtext) && (
        <div className={`stat-card-trend ${trendType}`}>
          {trendType === 'up' && <ArrowUpRight size={14} />}
          {trendType === 'down' && <ArrowDownRight size={14} />}
          {trendType === 'neutral' && <Minus size={14} />}
          <span>{trend || subtext}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;

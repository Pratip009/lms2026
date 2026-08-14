import React from 'react';

const DOT = { Green: '🟢', Orange: '🟠', Red: '🔴' };
const CLASS = { Green: 'badge-green', Orange: 'badge-yellow', Red: 'badge-red' };

export default function BhiColorBadge({ color, overridden }) {
  if (!color) return <span className="badge badge-gray">—</span>;
  return (
    <span className={`badge ${CLASS[color] || 'badge-gray'}`} title={overridden ? 'Manually overridden' : ''}>
      {DOT[color]} {color}{overridden ? ' ✎' : ''}
    </span>
  );
}

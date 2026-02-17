import React from 'react';
import './Loader.css';

export default function Loader() {
  return (
    <div className="loader-wrapper" aria-label="Loading puzzle…">
      <div className="loader-grid" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <span
            key={i}
            className="loader-cell"
            style={{ animationDelay: `${(i * 80)}ms` }}
          />
        ))}
      </div>
      <p className="loader-text">Loading today's puzzle…</p>
    </div>
  );
}

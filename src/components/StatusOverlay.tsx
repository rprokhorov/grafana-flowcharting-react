import React from 'react';
import '../styles/panel.css';

interface StatusOverlayProps {
  loading?: boolean;
  error?: string;
}

export const StatusOverlay: React.FC<StatusOverlayProps> = ({ loading, error }) => {
  if (!loading && !error) {
    return null;
  }

  return (
    <div className={`fc-status-overlay${error ? ' fc-status-overlay--error' : ''}`}>
      {loading && <span>Loading draw.io engine…</span>}
      {error && <span>Error: {error}</span>}
    </div>
  );
};

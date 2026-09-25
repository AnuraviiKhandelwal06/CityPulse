import React from 'react';

export default function CriticalAlertBanner({
  alert,
  onInspectEvidence = () => {}
}) {
  if (!alert) return null;

  return (
    <div className="w-full px-margin-desktop py-space-sm bg-surface-container-lowest border-b border-outline-variant/10">
      <div className="w-full p-space-md bg-surface-container-low border border-error/40 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md shadow-md">
        <div className="flex items-center gap-space-md flex-1 min-w-0">
          <div className="flex items-center gap-2 px-space-sm py-1 rounded-full bg-error text-on-error shrink-0 font-body-sm font-bold shadow-sm">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <span>CRITICAL ALERT</span>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
            {alert.summary_html ? (
              <span dangerouslySetInnerHTML={{ __html: alert.summary_html }} />
            ) : (
              alert.summary || 'Heavy rainfall coincides with acute traffic congestion and waterlogging reports across corridors.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-space-sm shrink-0">
          <button
            className="py-1.5 px-space-md rounded-lg bg-primary text-on-primary font-body-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            type="button"
            onClick={onInspectEvidence}
          >
            <span>Inspect Evidence</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}

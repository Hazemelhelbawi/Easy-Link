import { formatNumber } from '../utils/format.js';
import { t } from '../i18n/index.js';

function shouldShowStatusGroup(sheetStatus, statusOpts, stageOpts) {
  if (!statusOpts.length) return false;
  if (sheetStatus === 'underActivation' && stageOpts.length > 0) {
    const onlyPending = statusOpts.every((o) => o.value.trim().toLowerCase() === 'pending');
    if (onlyPending && statusOpts.length <= 2) return false;
  }
  return true;
}

export default function OrderFilterPanel({
  lang,
  sheetStatus,
  options,
  selectedStatuses,
  selectedStages,
  onToggleStatus,
  onToggleStage,
  onClear,
}) {
  const statusOpts = options.statusOptions || [];
  const stageOpts = options.stageOptions || [];
  const showStatus = shouldShowStatusGroup(sheetStatus, statusOpts, stageOpts);
  const showStage = stageOpts.length > 0;
  const hasPillFilters = selectedStatuses.length > 0 || selectedStages.length > 0;

  if (!showStatus && !showStage) return null;

  function renderPills(items, selected, onToggle) {
    return (
      <div className="order-filter-pills" role="group">
        {items.map((item) => {
          const active = selected.includes(item.value);
          return (
            <button
              key={item.value}
              type="button"
              className={`filter-pill ${active ? 'active' : ''}`}
              aria-pressed={active}
              onClick={() => onToggle(item.value)}
            >
              <span className="filter-pill-label">{item.value.trim()}</span>
              <span className="filter-pill-count" dir="ltr">
                {formatNumber(lang, item.count)}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="order-filter-panel">
      <div className="order-filter-panel-head">
        <div>
          <div className="order-filter-title">{t(lang, 'quickFilters')}</div>
          <div className="order-filter-sub">{t(lang, 'quickFiltersHint')}</div>
        </div>
        {hasPillFilters ? (
          <button type="button" className="btn ghost btn-sm" onClick={onClear}>
            {t(lang, 'clearQuickFilters')}
          </button>
        ) : null}
      </div>

      {hasPillFilters ? (
        <div className="active-filter-tags">
          {selectedStages.map((v) => (
            <button key={`s-${v}`} type="button" className="active-tag" onClick={() => onToggleStage(v)}>
              {v} ×
            </button>
          ))}
          {selectedStatuses.map((v) => (
            <button key={`t-${v}`} type="button" className="active-tag" onClick={() => onToggleStatus(v)}>
              {v} ×
            </button>
          ))}
        </div>
      ) : null}

      <div className={`order-filter-groups ${showStatus && showStage ? 'two-col' : ''}`}>
        {showStage ? (
          <div className="order-filter-group">
            <span className="order-filter-label">{t(lang, 'filterStage')}</span>
            {renderPills(stageOpts, selectedStages, onToggleStage)}
          </div>
        ) : null}
        {showStatus ? (
          <div className="order-filter-group">
            <span className="order-filter-label">{t(lang, 'filterStatus')}</span>
            {renderPills(statusOpts, selectedStatuses, onToggleStatus)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

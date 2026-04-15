export function StatCard({ title, items, accent }) {
  const accentClass = accent ? `stat-card--${accent}` : '';

  return (
    <div class={`stat-card ${accentClass}`}>
      {title && <div class="stat-card__title">{title}</div>}
      {items && items.map((item, i) => (
        <div key={i} class="stat-card__row">
          <span class="stat-card__label">{item.label}</span>
          <span class={`stat-card__value ${item.color ? `stat-card__value--${item.color}` : ''}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return <div className="skeleton skeleton-card" />;
}

export function SkeletonStat() {
  return <div className="skeleton skeleton-stat" />;
}

export function SkeletonText({ width = '100%' }) {
  return <div className="skeleton skeleton-text" style={{ width }} />;
}

export function SkeletonGrid({ count = 6, type = 'card' }) {
  const Component = type === 'stat' ? SkeletonStat : SkeletonCard;
  return (
    <div className={type === 'stat' ? 'stats-grid' : 'resource-grid'}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}

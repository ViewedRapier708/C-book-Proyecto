function SkeletonCard() {
  return <div className="skeleton skeleton-card" />;
}

function SkeletonStat() {
  return <div className="skeleton skeleton-stat" />;
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

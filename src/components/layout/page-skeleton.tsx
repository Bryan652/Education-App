export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading page" className="animate-pulse">
      <div className="mb-3 h-4 w-40 rounded bg-muted" />
      <div className="mb-8 h-10 w-72 max-w-full rounded-lg bg-muted" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-48 rounded-xl bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
      </div>
    </div>
  );
}

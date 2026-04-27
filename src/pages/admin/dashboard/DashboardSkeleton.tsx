export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-surface border border-border rounded-lg p-6 space-y-4 animate-pulse"
        >
          <div className="h-4 w-32 bg-muted/30 rounded" />
          <div className="h-8 w-24 bg-muted/30 rounded" />
          <div className="h-16 w-full bg-muted/20 rounded" />
        </div>
      ))}
    </div>
  )
}

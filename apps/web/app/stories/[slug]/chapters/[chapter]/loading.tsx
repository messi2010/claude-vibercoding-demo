export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-12 bg-surface border-b border-deep" />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full animate-pulse space-y-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-4 bg-surface rounded" style={{ width: `${70 + (i % 4) * 8}%` }} />
        ))}
      </div>
      <div className="h-12 bg-surface border-t border-deep" />
    </div>
  )
}

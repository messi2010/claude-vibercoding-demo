export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      {/* Genre chips skeleton */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-surface" />
        ))}
      </div>
      {/* Card grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl overflow-hidden">
            <div className="aspect-[2/3] bg-deep" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-deep rounded w-3/4" />
              <div className="h-3 bg-deep rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

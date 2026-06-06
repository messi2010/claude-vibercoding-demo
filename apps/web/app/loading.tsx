export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Filter bar skeleton */}
      <div className="bg-surface/50 rounded-xl p-4 mb-8 animate-pulse">
        <div className="h-9 bg-deep rounded-lg mb-3" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-20 bg-deep rounded-full shrink-0" />
          ))}
        </div>
      </div>

      {/* Section heading */}
      <div className="h-6 w-40 bg-deep rounded mb-4 animate-pulse" />

      {/* Featured grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] bg-deep rounded-xl mb-2" />
            <div className="h-4 bg-deep rounded w-3/4 mb-1" />
            <div className="h-3 bg-deep rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

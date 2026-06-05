export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 shrink-0">
          <div className="aspect-[2/3] rounded-xl bg-surface" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-surface rounded w-2/3" />
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-surface rounded-full" />
            <div className="h-6 w-20 bg-surface rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-surface rounded w-full" />
            <div className="h-3 bg-surface rounded w-5/6" />
            <div className="h-3 bg-surface rounded w-4/6" />
          </div>
          <div className="flex gap-3 pt-2">
            <div className="h-12 w-28 bg-surface rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

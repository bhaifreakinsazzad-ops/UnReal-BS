export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-pulse">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-7 w-24 rounded" />
            <div className="skeleton h-3 w-12 rounded" />
          </div>
        ))}
      </div>

      {/* List rows */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-40 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

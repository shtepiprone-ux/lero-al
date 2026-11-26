import { Skeleton } from '@/components/ui/skeleton'

export default function FavoritesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-muted/40 border-b">
        <div className="container-wide py-2.5">
          <Skeleton className="h-4 w-44 rounded" />
        </div>
      </div>

      <div className="container-wide py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-52 rounded-lg" />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

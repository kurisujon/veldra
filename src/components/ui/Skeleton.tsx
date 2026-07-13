import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/** Animated shimmer bar used as a placeholder. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-button bg-text-secondary/10',
        className
      )}
      aria-hidden="true"
    />
  )
}

/** A card-shaped skeleton block. */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-card bg-surface border border-text-secondary/10 p-lg flex flex-col gap-md',
        className
      )}
      aria-hidden="true"
    >
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-7 w-3/4" />
      <div className="mt-auto pt-md border-t border-text-secondary/10 flex justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-8" />
      </div>
    </div>
  )
}

/** A list-row skeleton for table-style views. */
export function SkeletonRow({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse flex items-center gap-md p-md border border-text-secondary/10 rounded-button',
        className
      )}
      aria-hidden="true"
    >
      <Skeleton className="h-10 w-10 rounded-button flex-shrink-0" />
      <div className="flex flex-col gap-xs flex-1 min-w-0">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20 flex-shrink-0" />
    </div>
  )
}

/** Full-page cases list skeleton. */
export function CasesListSkeleton() {
  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center justify-between gap-md mb-sm flex-wrap sm:flex-nowrap">
        <Skeleton className="h-input w-full sm:max-w-sm" />
        <Skeleton className="h-input w-full sm:w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md sm:gap-lg">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}

/** Drafts or Exports list skeleton. */
export function ListPageSkeleton() {
  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-col sm:flex-row gap-md mb-md">
        <Skeleton className="h-input w-full sm:max-w-xs" />
        <Skeleton className="h-input w-full sm:w-32" />
        <Skeleton className="h-input w-full sm:w-32" />
      </div>
      <div className="animate-pulse rounded-card bg-surface border border-text-secondary/10 p-xl flex flex-col gap-md min-h-[400px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  )
}

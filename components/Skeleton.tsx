
import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-pulse bg-slate-700/50 rounded-lg ${className}`}></div>
);

export const SummaryCardSkeleton = () => (
    <div className="bg-slate-900 border border-white/5 rounded-[32px] p-6 mb-4 h-[300px] flex flex-col justify-between overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-slate-800/10 to-transparent"></div>
        <div className="flex justify-between">
            <Skeleton className="w-32 h-8 rounded-xl" />
            <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
        <div>
            <Skeleton className="w-48 h-12 mb-2" />
            <Skeleton className="w-24 h-6" />
        </div>
        <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
        </div>
    </div>
);

export const AssetRowSkeleton = () => (
    <div className="p-4 flex items-center justify-between border-b border-[color:var(--border-color)]">
        <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <div className="space-y-2">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-16 h-3" />
            </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-14 h-6 rounded-lg" />
        </div>
    </div>
);


import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-[color:var(--muted-surface)] rounded-full flex items-center justify-center mb-4 text-[color:var(--text-muted)] border border-[color:var(--border-color)]">
            <PackageOpen size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-[color:var(--text-primary)] font-black text-lg mb-2">{title}</h3>
        <p className="text-[color:var(--text-muted)] text-sm max-w-[250px] leading-relaxed mb-6">{description}</p>
        {action}
    </div>
);

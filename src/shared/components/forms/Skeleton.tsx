import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rect' | 'circle';
    width?: string | number;
    height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rect',
    width,
    height
}) => {
    const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

    const variantClasses = {
        text: 'h-4 w-full rounded',
        rect: 'rounded-lg',
        circle: 'rounded-full'
    };

    const style: React.CSSProperties = {
        width: width,
        height: height
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

export const ProductCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
            <div className="w-full h-40 flex items-center justify-center p-4">
                <Skeleton variant="rect" className="w-full h-full" />
            </div>
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
                <div>
                    <Skeleton variant="text" className="w-3/4 mb-1" />
                    <Skeleton variant="text" className="w-1/2" />
                </div>
                <div className="flex justify-between items-end">
                    <Skeleton variant="rect" width={60} height={24} />
                    <Skeleton variant="rect" width={80} height={24} />
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <Skeleton variant="rect" className="flex-1 h-8" />
                    <Skeleton variant="rect" width={32} height={32} />
                </div>
            </div>
        </div>
    );
};

export default Skeleton;

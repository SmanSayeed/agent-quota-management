import { useEffect, useState } from 'react';
import { usePoolStore } from '../../store/poolStore';

interface LivePoolQuotaProps {
  className?: string;
  showLabel?: boolean;
}

export default function LivePoolQuota({ className = '', showLabel = true }: LivePoolQuotaProps) {
  const { availableQuota } = usePoolStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [previousQuota, setPreviousQuota] = useState(availableQuota);

  useEffect(() => {
    // Trigger animation when quota changes
    if (availableQuota !== previousQuota) {
      setIsUpdating(true);
      setPreviousQuota(availableQuota);
      
      // Reset animation after 2 seconds
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [availableQuota, previousQuota]);

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      {/* Live Indicator Dot */}
      <div className="relative flex items-center justify-center h-3 w-3">
        <span className={`
          absolute inline-flex h-full w-full rounded-full opacity-75 bg-secondary
          ${isUpdating ? 'animate-ping-big' : 'animate-pulse-radar'}
        `}></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
      </div>

      {/* Quota Display */}
      <div className="flex flex-col gap-0.5">
        {showLabel && (
          <span className="badge badge-secondary badge-xs font-extrabold text-secondary-content px-2 py-0 h-4 leading-none">
            LIVE QUOTA
          </span>
        )}
        <div className={`
          text-xl lg:text-2xl font-extrabold tabular-nums transition-all duration-300 text-base-content leading-tight
          ${isUpdating ? 'scale-110 text-secondary' : ''}
        `}>
          {availableQuota.toLocaleString()} <span className="text-xs font-medium text-base-content/60">units</span>
        </div>
      </div>

    </div>
  );
}

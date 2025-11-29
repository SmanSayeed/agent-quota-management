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
    <div className={`relative inline-flex items-center gap-3 ${className}`}>
      {/* Live Indicator Dot */}
      <div className="relative flex items-center justify-center h-4 w-4">
        <span className={`
          absolute inline-flex h-full w-full rounded-full opacity-75 bg-success
          ${isUpdating ? 'animate-ping-big' : 'animate-pulse-radar'}
        `}></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
      </div>

      {/* Quota Display */}
      <div className="flex flex-col">
        {showLabel && (
          <span className="text-xs font-medium opacity-70 uppercase tracking-wide">
            Live Pool Quota
          </span>
        )}
        <div className={`
          text-2xl font-bold tabular-nums transition-all duration-300 text-success
          ${isUpdating ? 'scale-110' : ''}
        `}>
          {availableQuota.toLocaleString()}
        </div>
      </div>

    </div>
  );
}

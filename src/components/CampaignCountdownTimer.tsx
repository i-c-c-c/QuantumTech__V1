import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Icons } from '../utilities/icons';

interface CampaignCountdownTimerProps {
  targetDate: string; // ISO date string
  label?: string;
  className?: string;
  onExpire?: () => void;
}

export const CampaignCountdownTimer: React.FC<CampaignCountdownTimerProps> = ({
  targetDate,
  label = 'Offer ends in:',
  className = '',
  onExpire,
}) => {
  const calculateTimeLeft = () => {
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = calculateTimeLeft();
      setTimeLeft(updated);
      if (updated.expired) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.expired) return null;

  return (
    <div data-testid="campaign-countdown-timer" className={`inline-flex flex-wrap items-center gap-2 sm:gap-2.5 ${className}`}>
      {label && (
        <span className="caption-3 font-semibold uppercase tracking-wider flex items-center gap-1.5 text-ink dark:text-slate-200">
          <FontAwesomeIcon icon={Icons.clock} className="h-3 w-3 text-quantum" />
          <span>{label}</span>
        </span>
      )}
      <div className="flex items-center gap-1 sm:gap-1.5 font-mono text-xs font-bold tabular-nums">
        <div className="flex flex-col items-center justify-center bg-slate-900 dark:bg-black/70 text-white px-2 sm:px-2.5 py-1 rounded-lg border border-slate-700/80 shadow-2xs min-w-[34px] sm:min-w-[38px]">
          <span className="text-xs sm:text-sm font-bold text-white tracking-tight leading-none">
            {String(timeLeft.days).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-300 dark:text-slate-400 font-sans font-semibold uppercase mt-0.5 tracking-wider">
            d
          </span>
        </div>
        <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">:</span>
        <div className="flex flex-col items-center justify-center bg-slate-900 dark:bg-black/70 text-white px-2 sm:px-2.5 py-1 rounded-lg border border-slate-700/80 shadow-2xs min-w-[34px] sm:min-w-[38px]">
          <span className="text-xs sm:text-sm font-bold text-white tracking-tight leading-none">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-300 dark:text-slate-400 font-sans font-semibold uppercase mt-0.5 tracking-wider">
            h
          </span>
        </div>
        <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">:</span>
        <div className="flex flex-col items-center justify-center bg-slate-900 dark:bg-black/70 text-white px-2 sm:px-2.5 py-1 rounded-lg border border-slate-700/80 shadow-2xs min-w-[34px] sm:min-w-[38px]">
          <span className="text-xs sm:text-sm font-bold text-white tracking-tight leading-none">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-300 dark:text-slate-400 font-sans font-semibold uppercase mt-0.5 tracking-wider">
            m
          </span>
        </div>
        <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">:</span>
        <div className="flex flex-col items-center justify-center bg-slate-900 dark:bg-black/70 text-white px-2 sm:px-2.5 py-1 rounded-lg border border-slate-700/80 shadow-2xs min-w-[34px] sm:min-w-[38px]">
          <span className="text-xs sm:text-sm font-bold text-white tracking-tight leading-none">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-300 dark:text-slate-400 font-sans font-semibold uppercase mt-0.5 tracking-wider">
            s
          </span>
        </div>
      </div>
    </div>
  );
};

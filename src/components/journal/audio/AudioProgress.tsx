import React from 'react';
import { formatTime } from '@/utils/audio';

interface AudioProgressProps {
  progress: number;
  duration: number;
  currentTime: number;
  onProgressChange: (value: number[]) => void;
}

const AudioProgress = ({ progress, duration, currentTime, onProgressChange }: AudioProgressProps) => {
  const formattedCurrentTime = isFinite(currentTime) ? formatTime(currentTime) : '0:00';
  const formattedDuration = isFinite(duration) ? formatTime(duration) : '0:00';

  return (
    <div className="flex-1 space-y-2">
      <div className="flex justify-start text-xs text-muted-foreground">
        <span>{formattedCurrentTime}</span>
        <span className="mx-1">/</span>
        <span>{formattedDuration}</span>
      </div>
    </div>
  );
};

export default AudioProgress;
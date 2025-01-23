import React from 'react';
import { Slider } from "@/components/ui/slider";
import { formatTime } from '@/utils/audio';

interface AudioProgressProps {
  progress: number;
  duration: number;
  currentTime: number;
  onProgressChange: (value: number[]) => void;
}

const AudioProgress = ({ progress, duration, currentTime, onProgressChange }: AudioProgressProps) => {
  // Ensure progress is a finite number between 0 and 100
  const safeProgress = isFinite(progress) ? Math.min(Math.max(progress, 0), 100) : 0;
  
  const handleProgressChange = (value: number[]) => {
    // Ensure the value is finite before calling the parent handler
    if (isFinite(value[0]) && duration > 0) {
      onProgressChange(value);
    }
  };

  return (
    <div className="flex-1 space-y-2">
      <div className="relative">
        <Slider
          value={[safeProgress]}
          min={0}
          max={100}
          step={0.1}
          className="w-full cursor-pointer transform-gpu"
          onValueChange={handleProgressChange}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default AudioProgress;
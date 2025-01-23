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
  // Only show time if we have valid duration
  const showTime = !isNaN(duration) && isFinite(duration) && duration > 0;
  
  return (
    <div className="flex-1">
      <div className="mb-2">
        <Slider
          value={[progress]}
          min={0}
          max={100}
          step={0.01}
          className="cursor-pointer transition-all duration-100"
          onValueChange={onProgressChange}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {showTime 
          ? `${formatTime(currentTime)} / ${formatTime(duration)}`
          : "Loading..."
        }
      </div>
    </div>
  );
};

export default AudioProgress;
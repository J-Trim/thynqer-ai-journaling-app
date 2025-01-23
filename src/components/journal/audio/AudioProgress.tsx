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
  return (
    <div className="flex-1 space-y-2">
      <div className="relative">
        <Slider
          value={[progress]}
          min={0}
          max={100}
          step={0.1}
          className="w-full cursor-pointer"
          onValueChange={onProgressChange}
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
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
    <div className="flex-1">
      <div className="mb-2">
        <Slider
          value={[progress]}
          min={0}
          max={100}
          step={0.1}
          onValueChange={onProgressChange}
          className="cursor-pointer"
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {`${formatTime(currentTime)} / ${formatTime(duration)}`}
      </div>
    </div>
  );
};

export default AudioProgress;
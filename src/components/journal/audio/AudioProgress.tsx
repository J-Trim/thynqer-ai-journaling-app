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
  const formattedCurrentTime = isFinite(currentTime) ? formatTime(currentTime) : '0:00';

  return (
    <div className="flex-1 space-y-2">
      <Slider
        value={[progress]}
        min={0}
        max={100}
        step={0.1}
        className="w-full cursor-pointer transform-gpu"
        onValueChange={onProgressChange}
      />
      <div className="flex justify-start text-xs text-muted-foreground">
        <span>{formattedCurrentTime}</span>
      </div>
    </div>
  );
};

export default AudioProgress;
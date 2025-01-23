import React from 'react';
import { Slider } from "@/components/ui/slider";

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number[]) => void;
}

const VolumeControl = ({ volume, isMuted, onVolumeChange }: VolumeControlProps) => {
  return (
    <div className="w-24">
      <Slider
        value={[isMuted ? 0 : volume]}
        min={0}
        max={1}
        step={0.01}
        onValueChange={onVolumeChange}
      />
    </div>
  );
};

export default VolumeControl;
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Repeat } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface AudioControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  hasEnded: boolean;
  showVolumeSlider: boolean;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onVolumeChange: (value: number) => void;
  setShowVolumeSlider: (show: boolean) => void;
}

const AudioControls = ({
  isPlaying,
  isMuted,
  volume,
  hasEnded,
  showVolumeSlider,
  onPlayPause,
  onMuteToggle,
  onVolumeChange,
  setShowVolumeSlider
}: AudioControlsProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleHideSlider = () => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      if (!isDragging) {
        setShowVolumeSlider(false);
      }
    }, 3000);
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0] / 100;
    onVolumeChange(newVolume);
    clearHideTimeout();
    
    if (!isDragging) {
      handleHideSlider();
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPlayPause}
        className="hover:bg-primary/20"
      >
        {hasEnded ? (
          <Repeat className="h-6 w-6" />
        ) : isPlaying ? (
          <Pause className="h-6 w-6" />
        ) : (
          <Play className="h-6 w-6" />
        )}
      </Button>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setShowVolumeSlider(!showVolumeSlider);
            if (!showVolumeSlider) {
              handleHideSlider();
            }
          }}
          className="hover:bg-primary/20"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="h-6 w-6" />
          ) : (
            <Volume2 className="h-6 w-6" />
          )}
        </Button>
        <div 
          className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-background rounded-lg shadow-lg transform transition-all duration-200",
            showVolumeSlider 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-2 pointer-events-none"
          )}
          onMouseEnter={clearHideTimeout}
          onMouseLeave={() => {
            if (!isDragging) {
              handleHideSlider();
            }
          }}
        >
          <Slider
            defaultValue={[volume * 100]}
            max={100}
            step={1}
            value={[volume * 100]}
            onValueChange={handleVolumeChange}
            onPointerDown={() => {
              clearHideTimeout();
              setIsDragging(true);
            }}
            onPointerUp={() => {
              setIsDragging(false);
              handleHideSlider();
            }}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioControls;
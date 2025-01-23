import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface AudioControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onVolumeChange: (value: number) => void;
}

const AudioControls = ({ 
  isPlaying, 
  isMuted, 
  volume,
  onPlayPause, 
  onMuteToggle,
  onVolumeChange 
}: AudioControlsProps) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

  const handleHideSlider = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 2000);
  };

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0] / 100;
    onVolumeChange(newVolume);
    
    // Automatically handle mute state based on volume
    if (newVolume === 0 && !isMuted) {
      onMuteToggle();
    } else if (newVolume > 0 && isMuted) {
      onMuteToggle();
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
        {isPlaying ? (
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
            setShowVolumeSlider(prev => !prev);
          }}
          onMouseLeave={handleHideSlider}
          className="hover:bg-primary/20"
        >
          {isMuted ? (
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
          onMouseEnter={() => {
            clearHideTimeout();
            setShowVolumeSlider(true);
          }}
          onMouseLeave={() => {
            hideTimeoutRef.current = setTimeout(() => {
              setShowVolumeSlider(false);
            }, 1000);
          }}
        >
          <Slider
            defaultValue={[volume * 100]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioControls;
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
  const [isDragging, setIsDragging] = useState(false);
  const [lastInteraction, setLastInteraction] = useState<number>(Date.now());
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
    setLastInteraction(Date.now());
    clearHideTimeout(); // Ensure the slider stays visible during volume changes
    
    // Only start the hide timer if we're not currently dragging
    if (!isDragging) {
      handleHideSlider();
    }
    
    // Handle mute state without affecting slider visibility
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
            setLastInteraction(Date.now());
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
          onMouseEnter={() => {
            clearHideTimeout();
            setShowVolumeSlider(true);
          }}
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
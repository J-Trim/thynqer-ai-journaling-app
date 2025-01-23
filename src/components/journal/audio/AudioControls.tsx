import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface AudioControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  onPlayPause: () => void;
  onMuteToggle: () => void;
}

const AudioControls = ({ isPlaying, isMuted, onPlayPause, onMuteToggle }: AudioControlsProps) => {
  return (
    <>
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
      <Button
        variant="ghost"
        size="icon"
        onClick={onMuteToggle}
        className="hover:bg-primary/20"
      >
        {isMuted ? (
          <VolumeX className="h-6 w-6" />
        ) : (
          <Volume2 className="h-6 w-6" />
        )}
      </Button>
    </>
  );
};

export default AudioControls;
import React, { useEffect, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";

interface AudioStateManagerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onTimeUpdate: () => void;
  onEnded: () => void;
}

const AudioStateManager = ({ 
  audioRef, 
  isPlaying, 
  setIsPlaying, 
  onTimeUpdate,
  onEnded 
}: AudioStateManagerProps) => {
  const { toast } = useToast();
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      console.log('Audio playback started');
      setIsPlaying(true);
      onTimeUpdate();
    };

    const handlePause = () => {
      console.log('Audio playback paused');
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    const handleError = (e: Event) => {
      const error = audio.error;
      const errorMessage = error 
        ? `Audio error: ${error.code} - ${error.message}`
        : 'Unknown audio error';
      console.error(errorMessage, e);
      toast({
        title: "Error",
        description: "Error playing audio. Please try again.",
        variant: "destructive",
      });
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', handleError);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioRef, setIsPlaying, onTimeUpdate, onEnded, toast]);

  return null;
};

export default AudioStateManager;
import { useState, useEffect } from 'react';

interface UseAudioPlaybackProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  onPlaybackEnd?: () => void;
}

export const useAudioPlayback = ({ audioRef, onPlaybackEnd }: UseAudioPlaybackProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    
    const handleEnded = () => {
      setIsPlaying(false);
      setHasEnded(true);
      if (onPlaybackEnd) {
        onPlaybackEnd();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onPlaybackEnd]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setHasEnded(false);
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling play state:', error);
      setIsPlaying(false);
    }
  };

  return {
    isPlaying,
    hasEnded,
    togglePlay
  };
};
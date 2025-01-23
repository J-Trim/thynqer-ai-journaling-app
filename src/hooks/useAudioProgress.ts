import { useState, useEffect, useRef } from 'react';

interface UseAudioProgressProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  totalDuration: number | null;
}

export const useAudioProgress = ({ audioRef, isPlaying, totalDuration }: UseAudioProgressProps) => {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const totalDur = totalDuration || duration;

    const updateProgress = () => {
      if (!audio || !isFinite(totalDur)) return;
      
      const newCurrentTime = audio.currentTime;
      const newProgress = (newCurrentTime / totalDur) * 100;
      
      setCurrentTime(newCurrentTime);
      setProgress(newProgress);

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    if (isPlaying) {
      updateProgress();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, duration, totalDuration]);

  const handleProgressChange = (newProgress: number) => {
    if (audioRef.current && (duration || totalDuration)) {
      const totalDur = totalDuration || duration;
      const newTime = (newProgress / 100) * totalDur;
      audioRef.current.currentTime = newTime;
      setProgress(newProgress);
      setCurrentTime(newTime);
    }
  };

  return {
    progress,
    currentTime,
    duration,
    setDuration,
    handleProgressChange
  };
};
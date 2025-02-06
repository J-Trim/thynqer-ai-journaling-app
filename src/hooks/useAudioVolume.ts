import { useState, useEffect } from 'react';

interface UseAudioVolumeProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  initialVolume?: number;
}

export const useAudioVolume = ({ audioRef, initialVolume = 1 }: UseAudioVolumeProps) => {
  const [volume, setVolume] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      audioRef.current!.volume = 0;
    } else {
      audioRef.current!.volume = volume;
    }
  };

  return {
    volume,
    isMuted,
    showVolumeSlider,
    setShowVolumeSlider,
    handleVolumeChange,
    toggleMute
  };
};
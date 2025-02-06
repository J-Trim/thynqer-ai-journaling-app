import React, { useState } from 'react';
import { useAudioProgress } from '@/hooks/useAudioProgress';
import { useAudioVolume } from '@/hooks/useAudioVolume';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useAudioInitialization } from '@/hooks/useAudioInitialization';
import AudioControls from './audio/AudioControls';
import AudioProgress from './audio/AudioProgress';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer = ({ audioUrl }: AudioPlayerProps) => {
  const [totalDuration, setTotalDuration] = useState<number | null>(null);

  const { error, isLoading, audioRef } = useAudioInitialization({
    audioUrl,
    onDurationCalculated: setTotalDuration,
    isMuted: false
  });

  const {
    volume,
    isMuted,
    showVolumeSlider,
    setShowVolumeSlider,
    handleVolumeChange,
    toggleMute
  } = useAudioVolume({ 
    audioRef,
    initialVolume: 1 
  });

  const { isPlaying, hasEnded, togglePlay } = useAudioPlayback({
    audioRef,
    onPlaybackEnd: () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }
  });

  const {
    progress,
    currentTime,
    duration,
    handleProgressChange
  } = useAudioProgress({ audioRef, isPlaying, totalDuration });

  if (isLoading) {
    return (
      <div 
        className="text-muted-foreground" 
        role="status" 
        aria-label="Loading audio player"
      >
        Loading audio...
      </div>
    );
  }

  if (error) {
    return (
      <Alert 
        variant="destructive" 
        className="mb-4"
        role="alert"
        aria-label="Audio player error"
      >
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div 
      className="p-4 bg-secondary rounded-lg space-y-4"
      role="region"
      aria-label="Audio player"
    >
      <div className="flex items-center gap-4">
        <AudioControls
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          onPlayPause={togglePlay}
          onMuteToggle={toggleMute}
          onVolumeChange={handleVolumeChange}
          hasEnded={hasEnded}
          showVolumeSlider={showVolumeSlider}
          setShowVolumeSlider={setShowVolumeSlider}
        />
        <AudioProgress
          progress={progress}
          duration={totalDuration || duration}
          currentTime={currentTime}
          onProgressChange={(values: number[]) => handleProgressChange(values[0])}
        />
      </div>
    </div>
  );
};

export default AudioPlayer;
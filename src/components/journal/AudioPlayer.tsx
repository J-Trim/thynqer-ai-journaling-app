import React, { useState, useRef, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AudioControls from "./audio/AudioControls";
import AudioProgress from "./audio/AudioProgress";
import VolumeControl from "./audio/VolumeControl";
import AudioInitializer from "./audio/AudioInitializer";
import AudioStateManager from "./audio/AudioStateManager";
import AudioLoader from "./audio/AudioLoader";

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer = ({ audioUrl }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasInitiatedLoad, setHasInitiatedLoad] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleAudioLoaded = (blobUrl: string) => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    blobUrlRef.current = blobUrl;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.src = blobUrl;
    audio.volume = volume;
    audio.muted = isMuted;
    audio.preload = "auto";

    audio.addEventListener('loadedmetadata', () => {
      console.log('Metadata loaded, duration:', audio.duration);
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        setCurrentTime(0);
        setProgress(0);
        setIsInitialized(true);
        setIsLoading(false);
        setError(null);
      }
    });

    audio.load();
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    const newCurrentTime = audio.currentTime;
    const newDuration = audio.duration;
    
    if (newDuration > 0 && isFinite(newDuration)) {
      const newProgress = (newCurrentTime / newDuration) * 100;
      setCurrentTime(newCurrentTime);
      setProgress(newProgress);
      setDuration(newDuration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const initializeAudio = async () => {
    setIsLoading(true);
    setHasInitiatedLoad(true);
    
    const filename = audioUrl.includes('/')
      ? audioUrl.split('/').pop()?.split('?')[0]
      : audioUrl;

    if (!filename) {
      throw new Error('Invalid audio URL format');
    }

    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Audio loading timeout - please try again'));
      }, 10000);

      const handleError = (error: Error) => {
        clearTimeout(timeoutId);
        setIsLoading(false);
        setError(error.message);
        reject(error);
      };

      const handleSuccess = (blobUrl: string) => {
        clearTimeout(timeoutId);
        handleAudioLoaded(blobUrl);
        resolve();
      };

      // Start loading the audio
      const loader = <AudioLoader
        filename={filename}
        onAudioLoaded={handleSuccess}
        onError={handleError}
      />;
    });
  };

  const togglePlay = async () => {
    if (!audioRef.current || !isInitialized) {
      setError('Audio not ready');
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error toggling play state:', error);
      setError(`Error playing audio: ${error.message}`);
      setIsPlaying(false);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!hasInitiatedLoad) {
    return (
      <AudioInitializer
        onInitialize={initializeAudio}
        isLoading={isLoading}
      />
    );
  }

  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center p-4 space-x-2 bg-secondary rounded-lg">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-muted-foreground">Loading audio...</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-secondary rounded-lg space-y-4">
      <AudioStateManager
        audioRef={audioRef}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <div className="flex items-center gap-4">
        <AudioControls
          isPlaying={isPlaying}
          isMuted={isMuted}
          onPlayPause={togglePlay}
          onMuteToggle={() => {
            if (audioRef.current) {
              audioRef.current.muted = !isMuted;
              setIsMuted(!isMuted);
            }
          }}
        />
        <AudioProgress
          progress={progress}
          duration={duration}
          currentTime={currentTime}
          onProgressChange={(newProgress) => {
            if (audioRef.current && duration) {
              const newTime = (newProgress[0] / 100) * duration;
              audioRef.current.currentTime = newTime;
              setProgress(newProgress[0]);
              setCurrentTime(newTime);
            }
          }}
        />
        <VolumeControl
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={(newVolume) => {
            const volumeValue = newVolume[0];
            if (audioRef.current) {
              audioRef.current.volume = volumeValue;
              setVolume(volumeValue);
              if (volumeValue === 0) {
                setIsMuted(true);
              } else if (isMuted) {
                setIsMuted(false);
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default AudioPlayer;
import React, { useState, useRef, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import AudioControls from "./audio/AudioControls";
import AudioProgress from "./audio/AudioProgress";
import VolumeControl from "./audio/VolumeControl";
import { getMimeType } from "@/utils/audio";

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
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number>();
  const initializationAttempts = useRef(0);
  const MAX_INIT_ATTEMPTS = 3;

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!audioUrl) {
          console.error('No audio URL provided');
          setError('No audio URL provided');
          return;
        }

        const filename = audioUrl.split('/').pop()?.split('?')[0];
        if (!filename) {
          console.error('Invalid audio URL format:', audioUrl);
          setError('Invalid audio URL format');
          return;
        }

        console.log('Starting audio download for:', filename);
        
        const { data: audioData, error: downloadError } = await supabase.storage
          .from('audio_files')
          .download(filename);

        if (downloadError) {
          console.error('Error downloading audio:', downloadError);
          setError(`Error downloading audio: ${downloadError.message}`);
          return;
        }

        if (!audioData) {
          console.error('No audio data received from storage');
          setError('No audio data received');
          return;
        }

        const mimeType = getMimeType(filename);
        const audioBlob = new Blob([audioData], { type: mimeType });
        console.log('Created audio blob with type:', mimeType);

        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }

        const newBlobUrl = URL.createObjectURL(audioBlob);
        blobUrlRef.current = newBlobUrl;
        console.log('Created blob URL:', newBlobUrl);

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        const audio = audioRef.current;
        audio.src = newBlobUrl;
        audio.volume = volume;
        audio.muted = isMuted;
        audio.preload = "metadata";

        // Wait for metadata to load before proceeding
        await new Promise<void>((resolve, reject) => {
          let metadataTimeout: NodeJS.Timeout;

          const handleLoadedMetadata = () => {
            clearTimeout(metadataTimeout);
            const audioDuration = audio.duration;
            console.log('Raw audio duration:', audioDuration);
            
            if (isFinite(audioDuration) && audioDuration > 0) {
              console.log('Setting valid duration:', audioDuration);
              setDuration(audioDuration);
              setCurrentTime(0);
              setProgress(0);
              cleanup();
              resolve();
            } else {
              console.error('Invalid duration received:', audioDuration);
              cleanup();
              reject(new Error('Invalid audio duration'));
            }
          };

          const handleError = (e: Event) => {
            clearTimeout(metadataTimeout);
            console.error('Error loading audio metadata:', e);
            cleanup();
            reject(new Error('Failed to load audio metadata'));
          };

          const cleanup = () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('error', handleError);
          };

          // Set a timeout for metadata loading
          metadataTimeout = setTimeout(() => {
            cleanup();
            reject(new Error('Metadata loading timeout'));
          }, 5000); // 5 second timeout

          audio.addEventListener('loadedmetadata', handleLoadedMetadata);
          audio.addEventListener('error', handleError);
          audio.load();
        });

        console.log('Audio initialized successfully with duration:', audioRef.current.duration);
        setError(null);
        setIsLoading(false);
        initializationAttempts.current = 0;
        
      } catch (error) {
        console.error('Error in audio setup:', error);
        initializationAttempts.current += 1;
        
        if (initializationAttempts.current < MAX_INIT_ATTEMPTS) {
          console.log(`Retrying initialization (attempt ${initializationAttempts.current + 1}/${MAX_INIT_ATTEMPTS})`);
          await initializeAudio();
        } else {
          setError(`Error setting up audio: ${error.message}`);
          setIsLoading(false);
        }
      }
    };

    initializeAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl, volume, isMuted]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const updateProgress = () => {
      if (!audio) return;
      
      const newCurrentTime = audio.currentTime;
      const newDuration = audio.duration;
      
      if (isFinite(newDuration) && newDuration > 0) {
        const newProgress = (newCurrentTime / newDuration) * 100;
        setCurrentTime(newCurrentTime);
        setProgress(newProgress);
        setDuration(newDuration);
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      updateProgress();
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      audio.currentTime = 0;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    const handleTimeUpdate = () => {
      const newTime = audio.currentTime;
      const newDuration = audio.duration;
      if (isFinite(newDuration) && newDuration > 0) {
        const newProgress = (newTime / newDuration) * 100;
        setCurrentTime(newTime);
        setProgress(newProgress);
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isPlaying]);

  const togglePlay = async () => {
    if (!audioRef.current) {
      console.error('No audio element available');
      setError('Audio not ready');
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('Attempting to play audio. Current duration:', audioRef.current.duration);
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
        }
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

  if (isLoading) {
    return <div className="text-muted-foreground">Loading audio...</div>;
  }

  return (
    <div className="p-4 bg-secondary rounded-lg space-y-4">
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
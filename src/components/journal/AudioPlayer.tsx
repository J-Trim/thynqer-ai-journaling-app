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
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setIsMetadataLoaded(false);
        
        if (!audioUrl) {
          console.error('No audio URL provided');
          setError('No audio URL provided');
          return;
        }

        // Extract filename from URL, handling both direct URLs and storage references
        const filename = audioUrl.includes('/')
          ? audioUrl.split('/').pop()?.split('?')[0]
          : audioUrl;

        if (!filename) {
          console.error('Invalid audio URL format:', audioUrl);
          setError('Invalid audio URL format');
          return;
        }

        console.log('Starting audio download for:', filename);
        console.log('Full audio URL:', audioUrl);
        
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

        console.log('Audio data received, size:', audioData.size);
        const mimeType = getMimeType(filename);
        console.log('Using MIME type:', mimeType);
        
        const audioBlob = new Blob([audioData], { type: mimeType });
        console.log('Created audio blob, size:', audioBlob.size);

        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }

        const newBlobUrl = URL.createObjectURL(audioBlob);
        console.log('Created blob URL:', newBlobUrl);
        blobUrlRef.current = newBlobUrl;

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        const audio = audioRef.current;
        audio.src = newBlobUrl;
        audio.volume = volume;
        audio.muted = isMuted;

        let loadTimeout: number;

        // Create a promise that resolves when metadata is properly loaded
        await new Promise((resolve, reject) => {
          const maxWaitTime = 30000; // 30 seconds timeout

          const cleanup = () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('canplaythrough', handleCanPlayThrough);
            audio.removeEventListener('error', handleError);
            window.clearTimeout(loadTimeout);
          };

          const handleLoadedMetadata = () => {
            console.log('Metadata loaded, duration:', audio.duration);
            if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
              setDuration(audio.duration);
              setCurrentTime(0);
              setProgress(0);
              setIsMetadataLoaded(true);
              cleanup();
              resolve(true);
            }
          };

          const handleCanPlayThrough = () => {
            console.log('Audio can play through');
            if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
              handleLoadedMetadata();
            }
          };

          const handleError = (e: Event) => {
            console.error('Audio loading error:', e, audio.error);
            cleanup();
            reject(new Error(`Failed to load audio: ${audio.error?.message || 'Unknown error'}`));
          };

          audio.addEventListener('loadedmetadata', handleLoadedMetadata);
          audio.addEventListener('canplaythrough', handleCanPlayThrough);
          audio.addEventListener('error', handleError);

          // Set a timeout to prevent infinite loading
          loadTimeout = window.setTimeout(() => {
            cleanup();
            reject(new Error('Audio loading timeout - please try again'));
          }, maxWaitTime);

          // Check if audio is already loaded
          if (audio.readyState >= 3 && audio.duration && isFinite(audio.duration) && audio.duration > 0) {
            handleLoadedMetadata();
          } else {
            console.log('Starting audio load...');
            audio.load();
          }
        });

        setIsLoading(false);
        setError(null);
        
      } catch (error) {
        console.error('Error in audio setup:', error);
        setError(`Error setting up audio: ${error.message}`);
        setIsLoading(false);
        setIsMetadataLoaded(false);
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
    if (!audioRef.current || !isMetadataLoaded) return;

    const audio = audioRef.current;

    const updateProgress = () => {
      if (!audio) return;
      
      const newCurrentTime = audio.currentTime;
      const newDuration = audio.duration;
      
      if (newDuration > 0 && isFinite(newDuration)) {
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

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
        updateProgress();
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

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    
    if (audio.readyState >= 2 && audio.duration && isFinite(audio.duration)) {
      handleLoadedMetadata();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isPlaying, isMetadataLoaded]);

  const togglePlay = async () => {
    if (!audioRef.current) {
      console.error('No audio element available');
      setError('Audio not ready');
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
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

  if (isLoading || !isMetadataLoaded) {
    return (
      <div className="flex items-center justify-center p-4 space-x-2 bg-secondary rounded-lg">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-muted-foreground">Loading audio... {audioRef.current?.readyState || 'Not initialized'}</span>
      </div>
    );
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
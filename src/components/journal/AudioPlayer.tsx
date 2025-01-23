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

        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }

        const newBlobUrl = URL.createObjectURL(audioBlob);
        blobUrlRef.current = newBlobUrl;

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        const audio = audioRef.current;
        audio.src = newBlobUrl;
        audio.volume = volume;
        audio.muted = isMuted;
        
        // Wait for metadata to load
        await new Promise((resolve, reject) => {
          const handleCanPlay = () => {
            audio.removeEventListener('canplay', handleCanPlay);
            setIsMetadataLoaded(true);
            resolve(true);
          };

          const handleError = (e: Event) => {
            audio.removeEventListener('error', handleError);
            reject(new Error('Failed to load audio'));
          };

          audio.addEventListener('canplay', handleCanPlay);
          audio.addEventListener('error', handleError);
          
          // If metadata is already loaded, resolve immediately
          if (audio.readyState >= 2) {
            handleCanPlay();
          } else {
            audio.load();
          }
        });

        setDuration(audio.duration);
        setCurrentTime(0);
        setProgress(0);
        setError(null);
        setIsLoading(false);
        
      } catch (error) {
        console.error('Error in audio setup:', error);
        setError(`Error setting up audio: ${error.message}`);
        setIsLoading(false);
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
      
      if (newDuration > 0) {
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
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
      updateProgress();
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
      if (newDuration > 0) {
        const newProgress = (newTime / newDuration) * 100;
        setCurrentTime(newTime);
        setProgress(newProgress);
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    // Initial progress update if metadata is already loaded
    if (audio.readyState >= 2) {
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
      audio.removeEventListener('timeupdate', handleTimeUpdate);
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

  if (isLoading) {
    return <div className="text-muted-foreground">Loading audio...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
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
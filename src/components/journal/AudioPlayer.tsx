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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

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

        // Extract filename from URL
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

        console.log('Audio file downloaded successfully, size:', audioData.size);

        const mimeType = getMimeType(filename);
        console.log('Using MIME type:', mimeType);
        
        const audioBlob = new Blob([audioData], { type: mimeType });
        console.log('Created audio blob, size:', audioBlob.size);

        // Clean up previous blob URL
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }

        const newBlobUrl = URL.createObjectURL(audioBlob);
        console.log('Created blob URL:', newBlobUrl);
        blobUrlRef.current = newBlobUrl;

        // Create new audio element if it doesn't exist
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        // Reset and prepare audio element
        const audio = audioRef.current;
        audio.pause();
        audio.currentTime = 0;
        audio.src = newBlobUrl;
        audio.volume = volume;
        audio.muted = isMuted;
        
        // Wait for audio to be loaded
        await new Promise((resolve, reject) => {
          const handleCanPlay = () => {
            console.log('Audio can play event triggered');
            audio.removeEventListener('canplay', handleCanPlay);
            resolve(true);
          };

          const handleError = (e: Event) => {
            console.error('Audio loading error:', e);
            audio.removeEventListener('error', handleError);
            reject(new Error('Failed to load audio'));
          };

          audio.addEventListener('canplay', handleCanPlay);
          audio.addEventListener('error', handleError);
          
          // Force load
          audio.load();
        });

        console.log('Audio loaded successfully');
        setError(null);
        
      } catch (error) {
        console.error('Error in audio setup:', error);
        setError(`Error setting up audio: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAudio();

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
  }, [audioUrl, volume, isMuted]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded:', {
        duration: audio.duration,
        readyState: audio.readyState
      });
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      console.log('Audio playback ended');
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) {
      console.error('No audio element available');
      setError('Audio not ready');
      return;
    }

    try {
      if (isPlaying) {
        console.log('Pausing audio');
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('Starting audio playback');
        await audioRef.current.play();
        console.log('Playback started successfully');
        setIsPlaying(true);
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
          onMuteToggle={() => setIsMuted(!isMuted)}
        />
        <AudioProgress
          progress={progress}
          duration={duration}
          currentTime={audioRef.current?.currentTime || 0}
          onProgressChange={(newProgress) => {
            const progressValue = newProgress[0];
            if (audioRef.current && duration) {
              const newTime = (progressValue / 100) * duration;
              audioRef.current.currentTime = newTime;
              setProgress(progressValue);
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
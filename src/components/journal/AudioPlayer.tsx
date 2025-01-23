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
  const audioRef = useRef<HTMLAudioElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchAndSetupAudio = async () => {
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
          console.error('Invalid audio URL format');
          setError('Invalid audio URL format');
          return;
        }

        console.log('Attempting to download audio file:', filename);
        
        const { data: audioData, error: downloadError } = await supabase.storage
          .from('audio_files')
          .download(filename);

        if (downloadError) {
          console.error('Error downloading audio:', downloadError);
          setError('Error downloading audio file');
          return;
        }

        if (!audioData) {
          console.error('No audio data received');
          setError('No audio data received');
          return;
        }

        const mimeType = getMimeType(filename);
        const audioBlob = new Blob([audioData], { type: mimeType });
        const newBlobUrl = URL.createObjectURL(audioBlob);
        
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        blobUrlRef.current = newBlobUrl;

        if (audioRef.current) {
          audioRef.current.src = newBlobUrl;
          audioRef.current.load();
          
          const playTestPromise = audioRef.current.play();
          if (playTestPromise !== undefined) {
            playTestPromise
              .then(() => {
                console.log('Audio playback test successful');
                audioRef.current?.pause();
                setIsPlaying(false);
              })
              .catch(e => {
                console.error('Audio playback test failed:', e);
                setError(`Playback error: ${e.message}`);
              });
          }
        }

      } catch (error) {
        console.error('Error setting up audio:', error);
        setError('Error setting up audio player');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSetupAudio();

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handleCanPlay = () => {
      console.log('Audio can play');
      setError(null);
      if (audio.duration) setDuration(audio.duration);
    };

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      setDuration(audio.duration);
      setError(null);
    };

    const handleError = () => {
      const errorMessage = audio.error?.message || 'Unknown error';
      console.error('Audio error:', errorMessage, 'Error code:', audio.error?.code);
      setError(`Error playing audio: ${errorMessage}`);
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      console.log('Audio playback ended');
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    audio.volume = volume;
    audio.muted = isMuted;
    
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [volume, isMuted]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
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
      <audio ref={audioRef} preload="metadata" />
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
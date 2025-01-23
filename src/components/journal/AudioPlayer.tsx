import React, { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

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

        console.log('Setting up audio for URL:', audioUrl);
        
        // Get the audio file directly from storage using download
        const { data: audioData, error: downloadError } = await supabase.storage
          .from('audio_files')
          .download(audioUrl);

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

        // Create a blob URL from the audio data with explicit MIME type
        const audioBlob = new Blob([audioData], { type: 'audio/webm' });
        const newBlobUrl = URL.createObjectURL(audioBlob);
        blobUrlRef.current = newBlobUrl;

        if (audioRef.current) {
          audioRef.current.src = newBlobUrl;
          audioRef.current.load();
        }

        console.log('Audio blob URL created:', newBlobUrl);
      } catch (error) {
        console.error('Error setting up audio:', error);
        setError('Error setting up audio player');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSetupAudio();

    // Cleanup function
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
      console.error('Audio error:', errorMessage);
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
      setError('Error playing audio: Format may not be supported');
      setIsPlaying(false);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
      <audio
        ref={audioRef}
        preload="metadata"
      />
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="hover:bg-primary/20"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (audioRef.current) {
              const newMutedState = !isMuted;
              audioRef.current.muted = newMutedState;
              setIsMuted(newMutedState);
            }
          }}
          className="hover:bg-primary/20"
        >
          {isMuted ? (
            <VolumeX className="h-6 w-6" />
          ) : (
            <Volume2 className="h-6 w-6" />
          )}
        </Button>
        <div className="flex-1">
          <div className="mb-2">
            <Slider
              value={[progress]}
              min={0}
              max={100}
              step={0.1}
              onValueChange={(newProgress) => {
                const progressValue = newProgress[0];
                if (audioRef.current && duration) {
                  const newTime = (progressValue / 100) * duration;
                  audioRef.current.currentTime = newTime;
                  setProgress(progressValue);
                }
              }}
              className="cursor-pointer"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {audioRef.current && (
              `${formatTime(audioRef.current.currentTime)} / ${formatTime(duration)}`
            )}
          </div>
        </div>
        <div className="w-24">
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(newVolume) => {
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
    </div>
  );
};

export default AudioPlayer;
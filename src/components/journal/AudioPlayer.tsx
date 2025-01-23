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
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchPublicUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!audioUrl) {
          console.error('No audio URL provided');
          setError('No audio URL provided');
          return;
        }

        console.log('Fetching public URL for:', audioUrl);
        const { data: publicUrlData } = supabase.storage
          .from('audio_files')
          .getPublicUrl(audioUrl);

        if (!publicUrlData?.publicUrl) {
          console.error('Failed to get public URL');
          setError('Failed to get public URL');
          return;
        }

        console.log('Public URL:', publicUrlData.publicUrl);
        setPublicUrl(publicUrlData.publicUrl);
      } catch (error) {
        console.error('Error fetching audio URL:', error);
        setError('Error fetching audio URL');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicUrl();
  }, [audioUrl]);

  useEffect(() => {
    if (!audioRef.current || !publicUrl) return;

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

    // Add event listeners
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Set initial audio properties
    audio.volume = volume;
    audio.muted = isMuted;
    audio.preload = "metadata";
    
    // Set source after event listeners are attached
    audio.src = publicUrl;
    audio.load();

    return () => {
      // Cleanup
      audio.pause();
      audio.src = '';
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [publicUrl, volume, isMuted]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if (!audioRef.current.src && publicUrl) {
          audioRef.current.src = publicUrl;
          audioRef.current.load();
        }
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error toggling play state:', error);
      setError('Error playing audio: Format may not be supported');
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
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
  };

  const handleProgressChange = (newProgress: number[]) => {
    const progressValue = newProgress[0];
    if (audioRef.current && duration) {
      const newTime = (progressValue / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(progressValue);
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
          onClick={toggleMute}
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
              onValueChange={handleProgressChange}
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
            onValueChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
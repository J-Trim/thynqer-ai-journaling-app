import React, { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer = ({ audioUrl }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;

      // Initialize audio element
      audio.volume = volume;
      audio.muted = isMuted;
      
      // Reset when URL changes
      audio.pause();
      setIsPlaying(false);
      audio.load();
      
      const handlePlay = () => {
        console.log('Audio play event triggered');
        setIsPlaying(true);
      };
      
      const handlePause = () => {
        console.log('Audio pause event triggered');
        setIsPlaying(false);
      };
      
      const handleEnded = () => {
        console.log('Audio playback ended');
        setIsPlaying(false);
        setProgress(0);
      };
      
      const handleError = (event: Event) => {
        console.error('Audio playback error:', event);
        setIsPlaying(false);
      };

      const handleTimeUpdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };

      // Add event listeners
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        // Cleanup event listeners
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [audioUrl, volume, isMuted]);

  const togglePlay = async () => {
    if (audioRef.current) {
      try {
        console.log('Attempting to toggle play state...');
        if (isPlaying) {
          console.log('Pausing audio...');
          audioRef.current.pause();
        } else {
          console.log('Playing audio...');
          await audioRef.current.play();
        }
      } catch (error) {
        console.error('Error toggling audio playback:', error);
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
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

  return (
    <div className="p-4 bg-secondary rounded-lg space-y-4">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
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
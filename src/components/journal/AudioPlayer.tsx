import React, { useState, useRef, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import AudioControls from "./audio/AudioControls";
import AudioProgress from "./audio/AudioProgress";
import { getMimeType } from "@/utils/audio";

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer = ({ audioUrl }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number>();
  const isDraggingRef = useRef(false);

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
        audio.muted = isMuted;
        audio.preload = "metadata";

        // Wait for the audio to be loaded
        await new Promise((resolve, reject) => {
          const handleLoadedMetadata = () => {
            if (isFinite(audio.duration)) {
              console.log('Audio metadata loaded. Duration:', audio.duration);
              setDuration(audio.duration);
              setCurrentTime(0);
              setProgress(0);
              audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
              resolve(true);
            }
          };

          const handleError = (e: Event) => {
            console.error('Error loading audio:', e);
            audio.removeEventListener('error', handleError);
            reject(new Error('Failed to load audio'));
          };

          audio.addEventListener('loadedmetadata', handleLoadedMetadata);
          audio.addEventListener('error', handleError);
        });

        setError(null);
        setIsLoading(false);
        console.log('Audio initialized successfully');
        
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
  }, [audioUrl, isMuted]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const updateProgress = () => {
      if (!audio || isDraggingRef.current || !isFinite(audio.duration)) return;
      
      const newCurrentTime = audio.currentTime;
      const newDuration = audio.duration;
      
      if (isFinite(newDuration) && newDuration > 0 && isFinite(newCurrentTime)) {
        const newProgress = (newCurrentTime / newDuration) * 100;
        setCurrentTime(newCurrentTime);
        setProgress(newProgress);
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

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isPlaying]);

  const handleProgressChange = (newProgress: number[]) => {
    if (!audioRef.current || !isFinite(duration)) return;
    
    isDraggingRef.current = true;
    const newTime = (newProgress[0] / 100) * duration;
    
    if (isFinite(newTime)) {
      audioRef.current.currentTime = newTime;
      setProgress(newProgress[0]);
      setCurrentTime(newTime);
    }
    
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };

  const togglePlay = async () => {
    if (!audioRef.current || !isFinite(audioRef.current.duration)) {
      console.error('Audio not ready');
      setError('Audio not ready');
      return;
    }

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
          onProgressChange={handleProgressChange}
        />
      </div>
    </div>
  );
};

export default AudioPlayer;
import React, { useState, useRef, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import AudioControls from "./audio/AudioControls";
import AudioProgress from "./audio/AudioProgress";
import VolumeControl from "./audio/VolumeControl";
import { getMimeType } from "@/utils/audio";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);
  const [hasInitiatedLoad, setHasInitiatedLoad] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number>();
  const { toast } = useToast();

  const initializeAudio = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsMetadataLoaded(false);
      
      if (!audioUrl) {
        console.error('No audio URL provided');
        throw new Error('No audio URL provided');
      }

      const filename = audioUrl.includes('/')
        ? audioUrl.split('/').pop()?.split('?')[0]
        : audioUrl;

      if (!filename) {
        console.error('Invalid audio URL format:', audioUrl);
        throw new Error('Invalid audio URL format');
      }

      console.log('Starting audio download for:', filename);
      
      // Download the audio file from Supabase storage
      const { data: audioData, error: downloadError } = await supabase.storage
        .from('audio_files')
        .download(filename);

      if (downloadError) {
        console.error('Error downloading audio:', downloadError);
        throw new Error(`Error downloading audio: ${downloadError.message}`);
      }

      if (!audioData) {
        console.error('No audio data received from storage');
        throw new Error('No audio data received');
      }

      const mimeType = getMimeType(filename);
      console.log('Using MIME type:', mimeType);
      
      // Create blob from audio data
      const audioBlob = new Blob([audioData], { type: mimeType });
      
      // Clean up previous blob URL
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }

      // Create new blob URL
      const newBlobUrl = URL.createObjectURL(audioBlob);
      blobUrlRef.current = newBlobUrl;

      // Initialize or reset audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      audio.src = newBlobUrl;
      audio.volume = volume;
      audio.muted = isMuted;
      audio.preload = "auto"; // Force preloading

      // Set up promise to handle audio loading with shorter timeout
      await new Promise((resolve, reject) => {
        const maxWaitTime = 10000; // 10 seconds timeout
        let metadataLoaded = false;
        let canPlayThrough = false;

        const checkComplete = () => {
          if (metadataLoaded && canPlayThrough) {
            cleanup();
            resolve(true);
          }
        };

        const cleanup = () => {
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('canplaythrough', handleCanPlayThrough);
          audio.removeEventListener('error', handleError);
          clearTimeout(loadTimeout);
        };

        const handleLoadedMetadata = () => {
          console.log('Metadata loaded, duration:', audio.duration);
          if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration);
            setCurrentTime(0);
            setProgress(0);
            setIsMetadataLoaded(true);
            metadataLoaded = true;
            checkComplete();
          }
        };

        const handleCanPlayThrough = () => {
          console.log('Audio can play through');
          canPlayThrough = true;
          checkComplete();
        };

        const handleError = (e: Event) => {
          const errorMessage = audio.error 
            ? `Audio error: ${audio.error.code} - ${audio.error.message}`
            : 'Unknown audio error';
          console.error(errorMessage, e);
          cleanup();
          reject(new Error(errorMessage));
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('canplaythrough', handleCanPlayThrough);
        audio.addEventListener('error', handleError);

        const loadTimeout = setTimeout(() => {
          cleanup();
          reject(new Error('Audio loading timeout - please try again'));
        }, maxWaitTime);

        // Force load
        audio.load();
      });

      setIsLoading(false);
      setError(null);
      toast({
        title: "Success",
        description: "Audio loaded successfully",
      });
      
    } catch (error) {
      console.error('Error in audio setup:', error);
      setError(error.message);
      setIsLoading(false);
      setIsMetadataLoaded(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
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
  }, []);

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
  }, [isPlaying, isMetadataLoaded]);

  const togglePlay = async () => {
    if (!hasInitiatedLoad) {
      console.log('Initiating audio load...');
      await initializeAudio();
      setHasInitiatedLoad(true);
      return;
    }

    if (!audioRef.current) {
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

  if (!hasInitiatedLoad) {
    return (
      <div className="p-4 bg-secondary rounded-lg">
        <Button 
          onClick={() => togglePlay()} 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
        >
          <Play className="h-4 w-4" />
          Load Audio
        </Button>
      </div>
    );
  }

  if (isLoading || !isMetadataLoaded) {
    return (
      <div className="flex items-center justify-center p-4 space-x-2 bg-secondary rounded-lg">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-muted-foreground">Loading audio...</span>
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
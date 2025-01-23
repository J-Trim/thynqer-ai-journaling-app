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

        // Validate blob content
        const validateBlob = async () => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result instanceof ArrayBuffer) {
                console.log('Blob validation successful, size:', reader.result.byteLength);
              } else {
                console.log('Blob validation successful, size:', reader.result.length);
              }
              resolve(true);
            };
            reader.onerror = () => {
              console.error('Blob validation failed:', reader.error);
              reject(reader.error);
            };
            reader.readAsArrayBuffer(audioBlob);
          });
        };

        await validateBlob();
        
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }

        const newBlobUrl = URL.createObjectURL(audioBlob);
        console.log('Created blob URL:', newBlobUrl);
        blobUrlRef.current = newBlobUrl;

        if (audioRef.current) {
          // Reset audio element state
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.src = newBlobUrl;
          
          // Force browser to load new audio source
          audioRef.current.load();
          console.log('Audio element loaded with new source');

          // Wait for audio to be loaded before attempting playback test
          await new Promise((resolve) => {
            if (!audioRef.current) return;
            
            const handleCanPlayThrough = () => {
              console.log('Audio can play through');
              audioRef.current?.removeEventListener('canplaythrough', handleCanPlayThrough);
              resolve(true);
            };
            
            audioRef.current.addEventListener('canplaythrough', handleCanPlayThrough);
          });

          // Test playback
          try {
            console.log('Testing audio playback...');
            console.log('Audio element state:', {
              src: audioRef.current.src,
              readyState: audioRef.current.readyState,
              paused: audioRef.current.paused,
              error: audioRef.current.error,
              networkState: audioRef.current.networkState,
              currentTime: audioRef.current.currentTime,
              duration: audioRef.current.duration
            });

            await audioRef.current.play();
            console.log('Playback test successful');
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          } catch (e) {
            console.error('Playback test failed:', e);
            setError(`Playback test failed: ${e.message}`);
          }
        }

      } catch (error) {
        console.error('Error in audio setup:', error);
        setError(`Error setting up audio: ${error.message}`);
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
        audioRef.current.load();
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handleCanPlay = () => {
      console.log('Audio can play event triggered');
      setError(null);
      if (audio.duration) {
        console.log('Audio duration:', audio.duration);
        setDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded:', {
        duration: audio.duration,
        readyState: audio.readyState,
        networkState: audio.networkState,
        paused: audio.paused,
        currentSrc: audio.currentSrc,
        error: audio.error
      });
      setDuration(audio.duration);
      setError(null);
    };

    const handleError = () => {
      const errorMessage = audio.error?.message || 'Unknown error';
      const errorCode = audio.error?.code || 'No error code';
      console.error('Audio error:', {
        message: errorMessage,
        code: errorCode,
        networkState: audio.networkState,
        readyState: audio.readyState,
        currentSrc: audio.currentSrc
      });
      setError(`Playback error: ${errorMessage} (Code: ${errorCode})`);
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
    if (!audioRef.current) {
      console.error('No audio element available');
      return;
    }

    try {
      if (isPlaying) {
        console.log('Pausing audio');
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('Starting audio playback');
        console.log('Audio state before play:', {
          src: audioRef.current.src,
          readyState: audioRef.current.readyState,
          paused: audioRef.current.paused,
          error: audioRef.current.error,
          networkState: audioRef.current.networkState,
          currentTime: audioRef.current.currentTime,
          duration: audioRef.current.duration
        });

        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log('Playback started successfully');
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
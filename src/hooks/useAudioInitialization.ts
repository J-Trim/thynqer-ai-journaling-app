import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getMimeType } from '@/utils/audio';

interface UseAudioInitializationProps {
  audioUrl: string;
  onDurationCalculated: (duration: number) => void;
  isMuted: boolean;
}

export const useAudioInitialization = ({ 
  audioUrl, 
  onDurationCalculated,
  isMuted 
}: UseAudioInitializationProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Memoize AudioContext creation
  const audioContext = useMemo(() => new AudioContext(), []);

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

        // Calculate duration using memoized AudioContext
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const calculatedDuration = audioBuffer.duration;
        onDurationCalculated(calculatedDuration);
        console.log('Calculated audio duration:', calculatedDuration);

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

        await new Promise((resolve, reject) => {
          const handleCanPlay = () => {
            console.log('Audio can play');
            audio.removeEventListener('canplay', handleCanPlay);
            resolve(true);
          };

          const handleError = (e: Event) => {
            console.error('Error loading audio:', e);
            audio.removeEventListener('error', handleError);
            reject(new Error('Failed to load audio'));
          };

          audio.addEventListener('canplay', handleCanPlay);
          audio.addEventListener('error', handleError);
        });

        setError(null);
        setIsLoading(false);
        
      } catch (error: any) {
        console.error('Error in audio setup:', error);
        setError(`Error setting up audio: ${error.message}`);
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
      audioContext.close();
    };
  }, [audioUrl, isMuted, audioContext, onDurationCalculated]);

  return {
    error,
    isLoading,
    audioRef
  };
};
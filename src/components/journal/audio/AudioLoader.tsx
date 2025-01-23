import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getMimeType } from "@/utils/audio";

interface AudioLoaderProps {
  filename: string;
  onAudioLoaded: (blobUrl: string) => void;
  onError: (error: Error) => void;
}

const AudioLoader = ({ filename, onAudioLoaded, onError }: AudioLoaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadAudio = async () => {
      try {
        setIsLoading(true);
        console.log('Starting audio download for:', filename);

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
        
        const audioBlob = new Blob([audioData], { type: mimeType });
        const blobUrl = URL.createObjectURL(audioBlob);
        
        onAudioLoaded(blobUrl);
        toast({
          title: "Success",
          description: "Audio loaded successfully",
        });
      } catch (error) {
        console.error('Error in audio setup:', error);
        onError(error);
        toast({
          title: "Error",
          description: error.message || "Failed to load audio",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (filename) {
      loadAudio();
    }

    return () => {
      // Cleanup will be handled by the parent component
    };
  }, [filename, onAudioLoaded, onError, toast]);

  return null;
};

export default AudioLoader;
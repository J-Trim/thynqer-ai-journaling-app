import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import AudioRecorder from "@/components/AudioRecorder";
import { supabase } from "@/integrations/supabase/client";

interface AudioHandlerProps {
  onAudioSaved: (audioUrl: string) => void;
  onTranscriptionComplete: (text: string) => void;
}

const AudioHandler = ({ onAudioSaved, onTranscriptionComplete }: AudioHandlerProps) => {
  const { toast } = useToast();
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleAudioSaved = async (audioFileName: string) => {
    try {
      setIsTranscribing(true);
      console.log('Starting audio transcription process for:', audioFileName);
      
      // Save the audio URL first
      onAudioSaved(audioFileName);
      
      console.log('Invoking transcribe-audio function...');
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl: audioFileName }
      });

      if (error) {
        console.error('Transcription error:', error);
        throw error;
      }

      if (data?.text) {
        console.log('Transcription completed successfully');
        onTranscriptionComplete(data.text);
        toast({
          title: "Success",
          description: "Audio transcribed successfully",
        });
      } else {
        console.error('No transcription text received');
        throw new Error('No transcription text received');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Error",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div>
      <AudioRecorder onAudioSaved={handleAudioSaved} />
      {isTranscribing && (
        <div className="mt-2 text-sm text-muted-foreground animate-pulse">
          Transcribing audio...
        </div>
      )}
    </div>
  );
};

export default AudioHandler;
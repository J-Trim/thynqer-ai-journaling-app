import { useState } from "react";
import AudioRecorder from "@/components/AudioRecorder";
import { supabase } from "@/integrations/supabase/client";

interface AudioHandlerProps {
  onAudioSaved: (audioUrl: string) => void;
  onTranscriptionComplete: (text: string) => void;
}

const AudioHandler = ({ onAudioSaved, onTranscriptionComplete }: AudioHandlerProps) => {
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
      } else {
        console.error('No transcription text received');
        throw new Error('No transcription text received');
      }
    } catch (error) {
      console.error('Transcription error:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div>
      <AudioRecorder onAudioSaved={handleAudioSaved} />
      {isTranscribing && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Transcribing audio...</span>
        </div>
      )}
    </div>
  );
};

export default AudioHandler;
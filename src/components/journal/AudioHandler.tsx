import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AudioRecorder from "@/components/AudioRecorder";
import { supabase } from "@/integrations/supabase/client";

interface AudioHandlerProps {
  onAudioSaved: (audioUrl: string) => void;
  onTranscriptionComplete: (text: string) => void;
  isRecording?: boolean;
  isPaused?: boolean;
  isProcessing?: boolean;
  onToggleRecording?: () => void;
  onStopRecording?: () => void;
}

const AudioHandler = ({ 
  onAudioSaved, 
  onTranscriptionComplete,
  isRecording,
  isPaused,
  isProcessing,
  onToggleRecording,
  onStopRecording
}: AudioHandlerProps) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { toast } = useToast();

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
        toast({
          title: "Transcription Failed",
          description: "Could not transcribe audio. Please try again.",
          variant: "destructive",
        });
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
        toast({
          title: "Error",
          description: "No transcription text received",
          variant: "destructive",
        });
        throw new Error('No transcription text received');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Error",
        description: "Failed to process audio",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div 
      className="relative"
      role="region"
      aria-label="Audio recording controls"
    >
      <AudioRecorder 
        onAudioSaved={handleAudioSaved}
        isRecording={isRecording}
        isPaused={isPaused}
        isProcessing={isProcessing}
        onToggleRecording={onToggleRecording}
        onStopRecording={onStopRecording}
      />
      {isTranscribing && (
        <div 
          className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"
          role="status"
          aria-label="Transcribing audio"
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Transcribing audio...</span>
        </div>
      )}
    </div>
  );
};

export default AudioHandler;
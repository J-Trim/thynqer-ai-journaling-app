import { useToast } from "@/components/ui/use-toast";
import AudioRecorder from "@/components/AudioRecorder";
import { supabase } from "@/integrations/supabase/client";

interface AudioHandlerProps {
  onAudioSaved: (audioUrl: string) => void;
  onTranscriptionComplete: (text: string) => void;
}

const AudioHandler = ({ onAudioSaved, onTranscriptionComplete }: AudioHandlerProps) => {
  const { toast } = useToast();

  const handleAudioSaved = async (audioFileName: string) => {
    onAudioSaved(audioFileName);
    
    try {
      console.log('Transcribing audio:', audioFileName);
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl: audioFileName }
      });

      if (error) throw error;

      if (data.text) {
        onTranscriptionComplete(data.text);
        toast({
          title: "Success",
          description: "Audio transcribed successfully",
        });
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Error",
        description: "Failed to transcribe audio",
        variant: "destructive",
      });
    }
  };

  return <AudioRecorder onAudioSaved={handleAudioSaved} />;
};

export default AudioHandler;
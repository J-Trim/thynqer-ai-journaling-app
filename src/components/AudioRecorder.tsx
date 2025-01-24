import { useAudioRecording } from "@/hooks/useAudioRecording";
import AudioRecorderControls from "@/components/journal/audio/AudioRecorderControls";
import AudioRecorderTimer from "@/components/journal/audio/AudioRecorderTimer";

interface AudioRecorderProps {
  onAudioSaved?: (url: string) => void;
}

const AudioRecorder = ({ onAudioSaved }: AudioRecorderProps) => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    isProcessing,
    toggleRecording,
    stopRecording
  } = useAudioRecording((url) => {
    if (onAudioSaved) {
      onAudioSaved(url);
    }
  });

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-secondary rounded-lg shadow-sm animate-fade-in">
      <AudioRecorderTimer recordingTime={recordingTime} />
      <AudioRecorderControls
        isRecording={isRecording}
        isPaused={isPaused}
        isProcessing={isProcessing}
        onToggleRecording={toggleRecording}
        onStopRecording={stopRecording}
      />
      {isProcessing && (
        <div className="text-sm text-muted-foreground animate-pulse">
          Processing audio...
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
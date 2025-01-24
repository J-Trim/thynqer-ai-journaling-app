import { useAudioRecording } from "@/hooks/useAudioRecording";
import AudioRecorderControls from "@/components/journal/audio/AudioRecorderControls";
import AudioRecorderTimer from "@/components/journal/audio/AudioRecorderTimer";

interface AudioRecorderProps {
  onAudioSaved?: (url: string) => void;
  isRecording?: boolean;
  isPaused?: boolean;
  isProcessing?: boolean;
  onToggleRecording?: () => void;
  onStopRecording?: () => void;
}

const AudioRecorder = ({ 
  onAudioSaved,
  isRecording: externalIsRecording,
  isPaused: externalIsPaused,
  isProcessing: externalIsProcessing,
  onToggleRecording: externalToggleRecording,
  onStopRecording: externalStopRecording
}: AudioRecorderProps) => {
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
        isRecording={externalIsRecording !== undefined ? externalIsRecording : isRecording}
        isPaused={externalIsPaused !== undefined ? externalIsPaused : isPaused}
        isProcessing={externalIsProcessing !== undefined ? externalIsProcessing : isProcessing}
        onToggleRecording={externalToggleRecording || toggleRecording}
        onStopRecording={externalStopRecording || stopRecording}
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
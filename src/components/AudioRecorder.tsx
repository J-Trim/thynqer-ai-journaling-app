
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
  isDisabled?: boolean;
}

const AudioRecorder = ({ 
  onAudioSaved,
  isRecording: externalIsRecording,
  isPaused: externalIsPaused,
  isProcessing: externalIsProcessing,
  onToggleRecording: externalToggleRecording,
  onStopRecording: externalStopRecording,
  isDisabled = false
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

  const handleToggleRecording = () => {
    if (externalToggleRecording) {
      externalToggleRecording();
    } else {
      toggleRecording();
    }
  };

  const handleStopRecording = () => {
    if (externalStopRecording) {
      externalStopRecording();
    } else {
      stopRecording();
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 p-6 bg-secondary rounded-lg shadow-sm animate-fade-in ${isDisabled ? 'opacity-50' : ''}`}>
      <AudioRecorderTimer recordingTime={recordingTime} />
      <AudioRecorderControls
        isRecording={externalIsRecording !== undefined ? externalIsRecording : isRecording}
        isPaused={externalIsPaused !== undefined ? externalIsPaused : isPaused}
        isProcessing={externalIsProcessing !== undefined ? externalIsProcessing : isProcessing}
        onToggleRecording={handleToggleRecording}
        onStopRecording={handleStopRecording}
        isDisabled={isDisabled}
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

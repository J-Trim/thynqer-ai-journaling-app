import { formatTime } from "@/utils/audio";

interface AudioRecorderTimerProps {
  recordingTime: number;
}

const AudioRecorderTimer = ({ recordingTime }: AudioRecorderTimerProps) => {
  return (
    <div className="text-2xl font-semibold text-text mb-4">
      {formatTime(recordingTime)}
    </div>
  );
};

export default AudioRecorderTimer;
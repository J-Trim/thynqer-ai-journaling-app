import { formatTime } from "@/utils/audio";

interface AudioRecorderTimerProps {
  recordingTime: number;
}

const AudioRecorderTimer = ({ recordingTime }: AudioRecorderTimerProps) => {
  return (
    <span className="font-mono">
      {formatTime(recordingTime)}
    </span>
  );
};

export default AudioRecorderTimer;
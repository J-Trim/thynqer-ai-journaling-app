interface TranscribedSectionProps {
  transcribedAudio: string;
  onTranscribedContentChange?: (value: string) => void;
}

const TranscribedSection = ({ transcribedAudio, onTranscribedContentChange }: TranscribedSectionProps) => {
  if (!transcribedAudio) return null;

  return (
    <div className="mt-4 p-4 bg-muted rounded-lg">
      <h3 className="text-sm font-medium mb-2">Transcribed Audio</h3>
      <textarea
        className="w-full min-h-[100px] p-2 text-sm text-muted-foreground whitespace-pre-wrap bg-transparent border-none focus:outline-none resize-y"
        value={transcribedAudio}
        onChange={(e) => onTranscribedContentChange?.(e.target.value)}
      />
    </div>
  );
};

export default TranscribedSection;
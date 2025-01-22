interface TranscribedSectionProps {
  transcribedAudio: string;
}

const TranscribedSection = ({ transcribedAudio }: TranscribedSectionProps) => {
  if (!transcribedAudio) return null;

  return (
    <div className="mt-4 p-4 bg-muted rounded-lg">
      <h3 className="text-sm font-medium mb-2">Transcribed Audio</h3>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {transcribedAudio}
      </p>
    </div>
  );
};

export default TranscribedSection;
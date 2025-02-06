
import ContentEditor from "./ContentEditor";
import TranscriptionDisplay from "./TranscriptionDisplay";

interface JournalFormContentProps {
  content: string;
  transcribedAudio: string | null;
  onContentChange: (value: string) => void;
}

const JournalFormContent = ({ 
  content, 
  transcribedAudio, 
  onContentChange 
}: JournalFormContentProps) => {
  // Extract main content without transcribed audio
  const mainContent = content.split('\n\n---\nTranscribed Audio:\n')[0];

  return (
    <div className="space-y-4">
      <ContentEditor
        content={mainContent}
        transcribedAudio={transcribedAudio}
        onContentChange={onContentChange}
      />
      <TranscriptionDisplay transcribedAudio={transcribedAudio} />
    </div>
  );
};

export default JournalFormContent;

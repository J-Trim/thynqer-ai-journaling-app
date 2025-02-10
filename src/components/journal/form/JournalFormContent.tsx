
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
  console.log('JournalFormContent rendering with:', { 
    content, 
    transcribedAudio,
    contentLength: content?.length || 0,
    transcribedAudioLength: transcribedAudio?.length || 0,
    hasTranscribedAudio: !!transcribedAudio
  });
  
  return (
    <div className="space-y-4">
      <ContentEditor
        content={content}
        transcribedAudio={transcribedAudio}
        onContentChange={onContentChange}
      />
      <TranscriptionDisplay transcribedAudio={transcribedAudio} />
    </div>
  );
};

export default JournalFormContent;

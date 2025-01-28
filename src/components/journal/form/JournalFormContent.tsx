import { Textarea } from "@/components/ui/textarea";

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
  // Only combine content with transcribed audio if there is transcribed audio
  // and ensure we're not duplicating content
  const fullContent = transcribedAudio 
    ? `${content || ''}\n\n${transcribedAudio}`
    : content;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // If there's transcribed audio, we need to preserve it and only update the user content
    if (transcribedAudio) {
      const transcriptionMarker = `\n\n${transcribedAudio}`;
      const contentWithoutTranscription = newValue.replace(transcriptionMarker, '');
      onContentChange(contentWithoutTranscription);
    } else {
      onContentChange(newValue);
    }
  };

  return (
    <Textarea
      placeholder="Start writing your thoughts..."
      value={fullContent}
      onChange={handleContentChange}
      className="min-h-[200px] resize-y"
    />
  );
};

export default JournalFormContent;
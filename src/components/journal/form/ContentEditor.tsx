
import { Textarea } from "@/components/ui/textarea";

interface ContentEditorProps {
  content: string;
  transcribedAudio: string | null;
  onContentChange: (value: string) => void;
}

const ContentEditor = ({ content, transcribedAudio, onContentChange }: ContentEditorProps) => {
  console.log('ContentEditor rendering with:', { content, transcribedAudio });

  // Combine content with transcription if available
  const displayContent = transcribedAudio 
    ? content
      ? `${content}\n\n${transcribedAudio}`
      : transcribedAudio
    : content;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    if (transcribedAudio) {
      // Remove transcribed section if present
      const transcribedIndex = newValue.lastIndexOf(transcribedAudio);
      const userContent = transcribedIndex >= 0
        ? newValue.slice(0, transcribedIndex).trim()
        : newValue;
      
      console.log('Updating content with user input:', userContent);
      onContentChange(userContent);
    } else {
      console.log('No transcription, updating content directly:', newValue);
      onContentChange(newValue);
    }
  };

  return (
    <Textarea
      placeholder="Start writing your thoughts..."
      value={displayContent}
      onChange={handleContentChange}
      className="min-h-[200px] resize-y"
    />
  );
};

export default ContentEditor;


import { Textarea } from "@/components/ui/textarea";

interface ContentEditorProps {
  content: string;
  transcribedAudio: string | null;
  onContentChange: (value: string) => void;
}

const ContentEditor = ({ content, transcribedAudio, onContentChange }: ContentEditorProps) => {
  console.log('ContentEditor rendering with:', { content, transcribedAudio });
  
  const fullContent = transcribedAudio 
    ? `${content}${content ? '\n\n' : ''}Transcribed Audio:\n${transcribedAudio}`
    : content;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    if (transcribedAudio) {
      // Extract only the user's content by removing the transcribed section
      const transcriptionMarker = `Transcribed Audio:\n${transcribedAudio}`;
      const parts = newValue.split(transcriptionMarker);
      const userContent = parts[0].trim();
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
      value={fullContent}
      onChange={handleContentChange}
      className="min-h-[200px] resize-y"
    />
  );
};

export default ContentEditor;

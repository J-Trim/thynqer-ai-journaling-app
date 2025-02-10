
import { Textarea } from "@/components/ui/textarea";

interface ContentEditorProps {
  content: string;
  transcribedAudio: string | null;
  onContentChange: (value: string) => void;
}

const ContentEditor = ({ content, transcribedAudio, onContentChange }: ContentEditorProps) => {
  console.log('ContentEditor rendering with:', { content, transcribedAudio });

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // If there's transcribed audio, we need to preserve only the user's content
    // by removing the transcribed section if present
    if (transcribedAudio) {
      const transcriptionMarker = 'Transcribed Audio:';
      const markerIndex = newValue.lastIndexOf(transcriptionMarker);
      
      if (markerIndex !== -1) {
        // Extract only the user's content part
        const userContent = newValue.substring(0, markerIndex).trim();
        console.log('Extracted user content:', userContent);
        onContentChange(userContent);
      } else {
        // If no marker is found, update the content normally
        console.log('Content changed by user to:', newValue);
        onContentChange(newValue);
      }
    } else {
      // No transcribed audio, update content normally
      console.log('Content changed by user to:', newValue);
      onContentChange(newValue);
    }
  };

  // Create the display value by combining content and transcription
  const displayContent = transcribedAudio 
    ? content + (content ? '\n\n' : '') + 'Transcribed Audio:\n' + transcribedAudio
    : content;

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


import { Textarea } from "@/components/ui/textarea";

interface ContentEditorProps {
  content: string;
  transcribedAudio: string | null;
  onContentChange: (value: string) => void;
}

const ContentEditor = ({ content, transcribedAudio, onContentChange }: ContentEditorProps) => {
  console.log('ContentEditor rendering with:', { content, transcribedAudio });

  // Create a combined display value that preserves both content and transcription
  const displayContent = transcribedAudio 
    ? content + (content ? '\n\n' : '') + 'Transcribed Audio:\n' + transcribedAudio
    : content;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // When user types, only update the main content, not the transcription
    const newValue = e.target.value;
    console.log('Content changed by user to:', newValue);
    onContentChange(newValue);
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

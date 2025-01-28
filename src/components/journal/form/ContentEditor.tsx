import { Textarea } from "@/components/ui/textarea";

interface ContentEditorProps {
  content: string;
  transcribedAudio: string | null;
  onContentChange: (value: string) => void;
}

const ContentEditor = ({ content, transcribedAudio, onContentChange }: ContentEditorProps) => {
  // Only append transcription if it exists
  const fullContent = transcribedAudio 
    ? `${content}\n\n---\nTranscribed Audio:\n${transcribedAudio}`
    : content;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    if (transcribedAudio) {
      // Extract only the user's content by removing the transcribed section
      const transcriptionMarker = `\n\n---\nTranscribed Audio:\n${transcribedAudio}`;
      const userContent = newValue.replace(transcriptionMarker, '');
      console.log('Updating content, removing transcription marker');
      onContentChange(userContent);
    } else {
      console.log('No transcription, updating content directly');
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
import { Textarea } from "@/components/ui/textarea";

interface ContentEditorProps {
  content: string;
  transcribedAudio: string | null;
  onContentChange: (value: string) => void;
}

const ContentEditor = ({ content, transcribedAudio, onContentChange }: ContentEditorProps) => {
  const fullContent = transcribedAudio 
    ? `${content || ''}\n\n${transcribedAudio}`
    : content;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
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

export default ContentEditor;
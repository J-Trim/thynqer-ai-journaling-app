
import { Textarea } from "@/components/ui/textarea";

interface ContentEditorProps {
  content: string;
  transcribedAudio: string | null;
  onContentChange: (value: string) => void;
}

const ContentEditor = ({ content, transcribedAudio, onContentChange }: ContentEditorProps) => {
  console.log('ContentEditor rendering with:', { content, transcribedAudio });

  const displayContent = transcribedAudio ? content + '\n\n' + transcribedAudio : content;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
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

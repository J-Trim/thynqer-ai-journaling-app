
import { Textarea } from "@/components/ui/textarea";

interface ContentEditorProps {
  content: string;
  transcribedAudio: string | null;
  onContentChange: (value: string) => void;
}

const ContentEditor = ({ content, transcribedAudio, onContentChange }: ContentEditorProps) => {
  console.log('ContentEditor rendering with:', { 
    content, 
    transcribedAudio,
    contentLength: content?.length || 0,
    transcribedAudioLength: transcribedAudio?.length || 0,
    hasTranscribedAudio: !!transcribedAudio
  });

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value);
  };

  return (
    <Textarea
      placeholder="Start writing your thoughts..."
      value={content}
      onChange={handleContentChange}
      className="min-h-[200px] resize-y"
    />
  );
};

export default ContentEditor;

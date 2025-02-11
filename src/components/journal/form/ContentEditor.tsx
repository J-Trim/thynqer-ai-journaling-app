
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

  const sanitizeContent = (text: string): string => {
    return text
      .replace(/\u200B/g, '') // Remove zero-width spaces
      .replace(/\u00A0/g, ' ') // Replace non-breaking spaces with regular spaces
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .trim();
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const sanitizedValue = sanitizeContent(e.target.value);
    console.log('Content change:', {
      original: e.target.value,
      sanitized: sanitizedValue,
      length: sanitizedValue.length
    });
    onContentChange(sanitizedValue);
  };

  // Ensure the displayed content is always sanitized
  const displayContent = sanitizeContent(content || '');

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

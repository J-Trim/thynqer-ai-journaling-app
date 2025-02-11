
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
    hasTranscribedAudio: !!transcribedAudio,
    contentDetails: {
      exactContent: content,
      trimmedLength: content?.trim().length || 0,
      hasWhitespace: /^\s|\s$/.test(content || ''),
      containsSpecialChars: /[^\w\s]/.test(content || ''),
      whitespaceLocations: (content || '').split('').map((char, i) => char === ' ' ? i : null).filter(i => i !== null)
    },
    transcribedDetails: transcribedAudio ? {
      exactText: transcribedAudio,
      trimmedLength: transcribedAudio.trim().length,
      hasWhitespace: /^\s|\s$/.test(transcribedAudio),
      containsSpecialChars: /[^\w\s]/.test(transcribedAudio),
      whitespaceLocations: transcribedAudio.split('').map((char, i) => char === ' ' ? i : null).filter(i => i !== null)
    } : null
  });

  const sanitizeContent = (text: string): string => {
    const sanitized = text
      .replace(/\u200B/g, '') // Remove zero-width spaces
      .replace(/\u00A0/g, ' ') // Replace non-breaking spaces with regular spaces
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .trim();

    console.log('Content sanitization:', {
      original: text,
      sanitized,
      originalLength: text.length,
      sanitizedLength: sanitized.length,
      removedCharacters: text.length - sanitized.length,
      whitespaceRemoved: text.length - text.trim().length,
      specialCharactersRemoved: (text.match(/[\u200B\u00A0]/g) || []).length
    });

    return sanitized;
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const sanitizedValue = sanitizeContent(e.target.value);
    console.log('Content change:', {
      original: e.target.value,
      sanitized: sanitizedValue,
      length: sanitizedValue.length,
      exactValue: sanitizedValue,
      trimmedLength: sanitizedValue.trim().length,
      hasWhitespace: /^\s|\s$/.test(sanitizedValue),
      whitespaceLocations: sanitizedValue.split('').map((char, i) => char === ' ' ? i : null).filter(i => i !== null)
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

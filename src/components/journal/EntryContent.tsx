import { Textarea } from "@/components/ui/textarea";

interface EntryContentProps {
  content: string;
  transcribedAudio?: string | null;
  onContentChange: (value: string) => void;
}

const EntryContent = ({ content, transcribedAudio, onContentChange }: EntryContentProps) => {
  // Combine main content with transcribed audio if present
  const fullContent = transcribedAudio 
    ? `${content}\n\n---\nTranscribed Audio:\n${transcribedAudio}`
    : content;

  return (
    <Textarea
      placeholder="Start writing your thoughts..."
      value={fullContent}
      onChange={(e) => onContentChange(e.target.value)}
      className="min-h-[200px] resize-y"
    />
  );
};

export default EntryContent;
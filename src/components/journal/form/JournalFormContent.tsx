import { Textarea } from "@/components/ui/textarea";

interface JournalFormContentProps {
  content: string;
  transcribedAudio: string | null;
  onContentChange: (value: string) => void;
}

const JournalFormContent = ({ 
  content, 
  transcribedAudio, 
  onContentChange 
}: JournalFormContentProps) => {
  const fullContent = transcribedAudio 
    ? `${content || ''}\n\n${transcribedAudio}`
    : content || '';

  return (
    <Textarea
      placeholder="Start writing your thoughts..."
      value={fullContent}
      onChange={(e) => onContentChange(e.target.value)}
      className="min-h-[200px] resize-y"
    />
  );
};

export default JournalFormContent;
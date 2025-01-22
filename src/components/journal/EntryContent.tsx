import { Textarea } from "@/components/ui/textarea";

interface EntryContentProps {
  content: string;
  onContentChange: (value: string) => void;
}

const EntryContent = ({ content, onContentChange }: EntryContentProps) => {
  return (
    <Textarea
      placeholder="Start writing your thoughts..."
      value={content}
      onChange={(e) => onContentChange(e.target.value)}
      className="min-h-[200px] resize-y"
    />
  );
};

export default EntryContent;
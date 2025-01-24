import { Input } from "@/components/ui/input";

interface JournalFormHeaderProps {
  title: string;
  onTitleChange: (value: string) => void;
}

const JournalFormHeader = ({ title, onTitleChange }: JournalFormHeaderProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold">Journal Entry</h2>
        <p className="text-muted-foreground">Capture your thoughts with text and voice</p>
      </div>
      <Input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="text-2xl font-semibold"
      />
    </div>
  );
};

export default JournalFormHeader;
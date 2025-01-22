import { Input } from "@/components/ui/input";

interface EntryHeaderProps {
  title: string;
  onTitleChange: (value: string) => void;
}

const EntryHeader = ({ title, onTitleChange }: EntryHeaderProps) => {
  return (
    <Input
      type="text"
      placeholder="Title (optional)"
      value={title}
      onChange={(e) => onTitleChange(e.target.value)}
      className="text-2xl font-semibold"
    />
  );
};

export default EntryHeader;
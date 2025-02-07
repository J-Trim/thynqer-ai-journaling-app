
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Tag {
  id: string;
  name: string;
}

interface TagFilterProps {
  tags: Tag[];
  selectedTags: string[];
  onTagToggle: (tagId: string) => void;
}

const TagFilter = ({ tags, selectedTags, onTagToggle }: TagFilterProps) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Filter by Tags</h3>
      <ScrollArea className="h-16">
        <div className="space-x-2">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onTagToggle(tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TagFilter;

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TagSelectorProps {
  selectedTags: string[];
  onTagToggle: (tagId: string) => void;
}

const TagSelector = ({ selectedTags, onTagToggle }: TagSelectorProps) => {
  const navigate = useNavigate();
  
  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Loading tags...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Tags</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/tags")}
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Manage Tags
        </Button>
      </div>
      <ScrollArea className="h-24 w-full rounded-md border">
        <div className="p-4 space-y-2">
          {tags && tags.length > 0 ? (
            tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                className="mr-2 mb-2 cursor-pointer"
                onClick={() => onTagToggle(tag.id)}
              >
                {tag.name}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No tags available</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TagSelector;
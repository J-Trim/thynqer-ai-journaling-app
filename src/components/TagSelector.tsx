
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface TagSelectorProps {
  selectedTags: string[];
  onTagToggle: (tagId: string) => void;
  readOnly?: boolean;
  className?: string;
}

const TagSelector = ({ selectedTags, onTagToggle, readOnly = false, className = '' }: TagSelectorProps) => {
  const navigate = useNavigate();
  const [showTags, setShowTags] = useState(false);
  
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

  // Show selected tags count and names
  const selectedCount = selectedTags.length;
  const selectedTagNames = tags?.filter(tag => selectedTags.includes(tag.id))
    .map(tag => tag.name)
    .join(', ');

  const handleTagClick = (tagId: string) => {
    if (!readOnly) {
      onTagToggle(tagId);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => !readOnly && setShowTags(!showTags)}
        className="w-full flex items-center justify-between"
        disabled={readOnly}
      >
        <span className="flex items-center">
          <Tag className="h-4 w-4 mr-2" />
          Tags {selectedCount > 0 && `(${selectedCount} selected)`}
        </span>
        {!readOnly && (showTags ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
      </Button>

      {(showTags || readOnly) && (
        <Card className="bg-muted animate-fade-in">
          <CardContent className="pt-4">
            {!readOnly && (
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Manage Tags</h3>
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
            )}

            {isLoading ? (
              <div className="animate-pulse text-muted-foreground">Loading tags...</div>
            ) : (
              <ScrollArea className="h-24 w-full rounded-md border">
                <div className="p-4 space-y-2">
                  {tags && tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                          className={`
                            flex items-center gap-1 transition-colors
                            ${readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-muted-foreground/10'}
                          `}
                          onClick={() => handleTagClick(tag.id)}
                          role={!readOnly ? "button" : undefined}
                          tabIndex={!readOnly ? 0 : undefined}
                          onKeyDown={(e) => {
                            if (!readOnly && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              handleTagClick(tag.id);
                            }
                          }}
                        >
                          <Tag className="h-3 w-3" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags available</p>
                  )}
                </div>
              </ScrollArea>
            )}

            {selectedCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Selected: {selectedTagNames}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TagSelector;

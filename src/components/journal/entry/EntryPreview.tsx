
import React from "react";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Tag } from "lucide-react";

interface EntryPreviewProps {
  preview: string;
  audioPlayer?: React.ReactNode;
  entryId?: string;
}

const EntryPreview = React.memo(({ preview, audioPlayer, entryId }: EntryPreviewProps) => {
  const { data: tags, isError, error } = useQuery({
    queryKey: ['entry-tags', entryId],
    queryFn: async () => {
      if (!entryId) return [];
      
      const { data: entryTags, error } = await supabase
        .from('entry_tags')
        .select(`
          tag_id,
          tags:tags(name)
        `)
        .eq('entry_id', entryId);

      if (error) throw error;
      
      // Validate the response data
      if (!Array.isArray(entryTags)) {
        throw new Error('Invalid response format for tags');
      }

      // Filter out any invalid tag entries
      return entryTags
        .filter(tag => tag.tag_id && tag.tags?.name)
        .map(tag => ({
          id: tag.tag_id,
          name: tag.tags.name
        }));
    },
    enabled: !!entryId,
    retry: 2, // Retry failed requests twice
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const displayPreview = preview?.trim() 
    ? preview 
    : "No content available";

  return (
    <CardContent>
      <p className="text-text-muted line-clamp-2">{displayPreview}</p>
      
      {isError && (
        <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Failed to load tags</span>
        </div>
      )}
      
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map(tag => (
            <Badge 
              key={tag.id} 
              variant="outline" 
              className="text-xs flex items-center gap-1"
            >
              <Tag className="h-3 w-3" />
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
      
      {audioPlayer && (
        <div 
          className="mt-4" 
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
            }
          }}
          role="region"
          aria-label="Audio player"
          tabIndex={0}
        >
          {audioPlayer}
        </div>
      )}
    </CardContent>
  );
});

EntryPreview.displayName = "EntryPreview";

export default EntryPreview;


import React from "react";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EntryPreviewProps {
  preview: string;
  audioPlayer?: React.ReactNode;
  entryId?: string;
}

const EntryPreview = React.memo(({ preview, audioPlayer, entryId }: EntryPreviewProps) => {
  const { data: tags } = useQuery({
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
      return entryTags.map(tag => ({
        id: tag.tag_id,
        name: tag.tags.name
      }));
    },
    enabled: !!entryId
  });

  const displayPreview = preview?.trim() 
    ? preview 
    : "No content available";

  return (
    <CardContent>
      <p className="text-text-muted line-clamp-2">{displayPreview}</p>
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map(tag => (
            <Badge 
              key={tag.id} 
              variant="outline" 
              className="text-xs"
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
      {audioPlayer && (
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          {audioPlayer}
        </div>
      )}
    </CardContent>
  );
});

EntryPreview.displayName = "EntryPreview";

export default EntryPreview;

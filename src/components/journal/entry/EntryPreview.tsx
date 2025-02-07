
import React from "react";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EntryPreviewProps {
  preview: string;
  audioPlayer?: React.ReactNode;
  entryId?: string;
}

const EntryPreview = React.memo(({ preview, audioPlayer, entryId }: EntryPreviewProps) => {
  const { toast } = useToast();

  const { data: tags, isError, error } = useQuery({
    queryKey: ['entry-tags', entryId],
    queryFn: async () => {
      if (!entryId) return [];
      
      try {
        const { data: entryTags, error } = await supabase
          .from('entry_tags')
          .select(`
            tag_id,
            tags:tags(name)
          `)
          .eq('entry_id', entryId);

        if (error) throw error;
        
        if (!Array.isArray(entryTags)) {
          throw new Error('Invalid response format for tags');
        }

        return entryTags
          .filter(tag => tag.tag_id && tag.tags?.name)
          .map(tag => ({
            id: tag.tag_id,
            name: tag.tags.name
          }));
      } catch (err) {
        console.error('Error fetching tags:', err);
        toast({
          title: "Error",
          description: "Failed to load tags. Please refresh the page.",
          variant: "destructive",
        });
        throw err;
      }
    },
    enabled: !!entryId,
    retry: 2,
    staleTime: 30000,
    onError: (err) => {
      console.error('Query error:', err);
      toast({
        title: "Error",
        description: "Failed to load tags. Please refresh the page.",
        variant: "destructive",
      });
    }
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

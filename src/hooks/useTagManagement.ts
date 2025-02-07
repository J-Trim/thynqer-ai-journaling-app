
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export const useTagManagement = (entryId: string | undefined) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load existing tags for the entry
  const { data: entryTags } = useQuery({
    queryKey: ['entry-tags', entryId],
    queryFn: async () => {
      if (!entryId) return [];
      const { data, error } = await supabase
        .from('entry_tags')
        .select('tag_id')
        .eq('entry_id', entryId);

      if (error) throw error;
      return data.map(et => et.tag_id);
    },
    enabled: !!entryId
  });

  // Update selectedTags when entryTags loads
  useEffect(() => {
    if (entryTags) {
      setSelectedTags(entryTags);
    }
  }, [entryTags]);

  const updateEntryTagsMutation = useMutation({
    mutationFn: async ({ entryId, tagIds }: { entryId: string, tagIds: string[] }) => {
      // Delete existing tags
      const { error: deleteError } = await supabase
        .from('entry_tags')
        .delete()
        .eq('entry_id', entryId);

      if (deleteError) throw deleteError;

      // Insert new tags if there are any
      if (tagIds.length > 0) {
        const { error: insertError } = await supabase
          .from('entry_tags')
          .insert(tagIds.map(tagId => ({
            entry_id: entryId,
            tag_id: tagId
          })));

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entry-tags'] });
      toast({
        title: "Success",
        description: "Tags updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update tags",
        variant: "destructive",
      });
    }
  });

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return {
    selectedTags,
    setSelectedTags,
    entryTags,
    updateEntryTagsMutation,
    handleTagToggle
  };
};

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTagManagement = (entryId: string | null) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const queryClient = useQueryClient();

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

  const updateEntryTagsMutation = useMutation({
    mutationFn: async ({ entryId, tagIds }: { entryId: string, tagIds: string[] }) => {
      const { error: deleteError } = await supabase
        .from('entry_tags')
        .delete()
        .eq('entry_id', entryId);

      if (deleteError) throw deleteError;

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

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseJournalLoadProps {
  id?: string;
  onLoadComplete: (data: {
    title: string;
    content: string;
    audioUrl: string | null;
    transcribedAudio: string;
    tagIds: string[];
  }) => void;
}

export const useJournalLoad = ({ id, onLoadComplete }: UseJournalLoadProps) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadEntry = async () => {
      if (!id) {
        setIsInitializing(false);
        return;
      }

      try {
        const { data: entry, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Fetch tags for this entry
        const { data: entryTags, error: tagsError } = await supabase
          .from('entry_tags')
          .select('tag_id')
          .eq('entry_id', id);

        if (tagsError) throw tagsError;

        if (entry) {
          const [mainContent, transcribed] = entry.text ? 
            entry.text.split("\n\n---\nTranscribed Audio:\n") : 
            ["", ""];

          onLoadComplete({
            title: entry.title || '',
            content: mainContent || '',
            audioUrl: entry.audio_url,
            transcribedAudio: transcribed || '',
            tagIds: entryTags?.map(et => et.tag_id) || []
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load journal entry",
          variant: "destructive",
        });
      } finally {
        setIsInitializing(false);
      }
    };

    loadEntry();
  }, [id, toast, onLoadComplete]);

  return { isInitializing };
};

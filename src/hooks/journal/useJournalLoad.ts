
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
        // Load entry with tags in a single query using joins
        const { data: entry, error } = await supabase
          .from('journal_entries')
          .select(`
            *,
            entry_tags(tag_id)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        if (entry) {
          const [mainContent, transcribed] = entry.text ? 
            entry.text.split("\n\n---\nTranscribed Audio:\n") : 
            ["", ""];

          // Extract tag IDs from the joined data
          const tagIds = entry.entry_tags 
            ? entry.entry_tags.map(et => et.tag_id) 
            : [];

          onLoadComplete({
            title: entry.title || '',
            content: mainContent || '',
            audioUrl: entry.audio_url,
            transcribedAudio: transcribed || '',
            tagIds
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

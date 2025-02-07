
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
        console.log('Loading entry:', id);
        const { data: entry, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (entry) {
          console.log('Entry loaded:', entry);
          const [mainContent, transcribed] = entry.text ? 
            entry.text.split("\n\n---\nTranscribed Audio:\n") : 
            ["", ""];

          onLoadComplete({
            title: entry.title || '',
            content: mainContent || '',
            audioUrl: entry.audio_url,
            transcribedAudio: transcribed || ''
          });
        }
      } catch (error) {
        console.error('Error loading entry:', error);
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

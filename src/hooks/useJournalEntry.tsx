import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { UnsavedChangesContext } from "@/contexts/UnsavedChangesContext";

interface JournalEntry {
  id: string;
  title: string;
  text: string;
  audio_url: string | null;
}

export const useJournalEntry = (id?: string) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [transcribedAudio, setTranscribedAudio] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSaveInProgress, setIsSaveInProgress] = useState(false);
  const [initialContent, setInitialContent] = useState({ 
    title: "", 
    content: "", 
    audioUrl: null,
    transcribedAudio: "" 
  });

  const { hasUnsavedChanges, setHasUnsavedChanges } = useContext(UnsavedChangesContext);
  const { toast } = useToast();
  const navigate = useNavigate();

  const hasActualChanges = () => {
    return title !== initialContent.title || 
           content !== initialContent.content || 
           audioUrl !== initialContent.audioUrl;
  };

  useEffect(() => {
    if (!isInitializing) {
      setHasUnsavedChanges(hasActualChanges());
    }
  }, [title, content, audioUrl, isInitializing, setHasUnsavedChanges]);

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

        if (entry) {
          const [mainContent, transcribed] = entry.text ? 
            entry.text.split("\n\n---\nTranscribed Audio:\n") : 
            ["", ""];

          setTitle(entry.title || '');
          setContent(mainContent || '');
          setTranscribedAudio(transcribed || '');
          setAudioUrl(entry.audio_url);
          setInitialContent({
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
  }, [id, toast]);

  const saveEntry = async (isAutoSave = false) => {
    if (isInitializing || isSaveInProgress) {
      console.log('Save prevented - initialization or save in progress');
      return null;
    }
    
    try {
      setIsSaveInProgress(true);
      setIsSaving(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('You must be logged in to save entries');
      }

      let finalContent = content;
      
      if (audioUrl && !transcribedAudio) {
        console.log('Transcribing audio before saving:', audioUrl);
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audioUrl }
        });

        if (error) {
          console.error('Transcription error:', error);
          throw new Error('Failed to transcribe audio');
        }

        if (data.text) {
          const newTranscribedText = data.text;
          setTranscribedAudio(newTranscribedText);
          finalContent = content ? content : '';
        }
      }

      const fullText = transcribedAudio 
        ? `${finalContent}\n\n---\nTranscribed Audio:\n${transcribedAudio}`
        : finalContent;

      const entryData = {
        user_id: user.id,
        title: title || `Journal Entry - ${format(new Date(), 'P')}`,
        text: fullText,
        audio_url: audioUrl,
        has_been_edited: id ? hasActualChanges() : false,
      };

      // Check if an entry with the same content already exists
      if (!id) {
        const { data: existingEntries, error: checkError } = await supabase
          .from("journal_entries")
          .select("id")
          .eq('text', fullText)
          .eq('user_id', user.id)
          .limit(1);

        if (checkError) throw checkError;

        if (existingEntries && existingEntries.length > 0) {
          console.log('Duplicate entry detected, skipping save');
          if (!isAutoSave) {
            toast({
              title: "Info",
              description: "This entry has already been saved.",
            });
            navigate("/journal", { replace: true });
          }
          return null;
        }
      }

      const { data: savedEntry, error: saveError } = id
        ? await supabase
            .from("journal_entries")
            .update(entryData)
            .eq('id', id)
            .select()
            .single()
        : await supabase
            .from("journal_entries")
            .insert([entryData])
            .select()
            .single();

      if (saveError) throw saveError;

      setInitialContent({
        title: entryData.title,
        content: finalContent,
        audioUrl: entryData.audio_url,
        transcribedAudio: transcribedAudio
      });
      
      setHasUnsavedChanges(false);
      
      if (!isAutoSave) {
        toast({
          title: "Success",
          description: "Journal entry saved successfully",
        });
        navigate("/journal", { replace: true });
      }

      return savedEntry as JournalEntry;
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save journal entry",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
      setIsSaveInProgress(false);
    }
  };

  const handleNavigateAway = async () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("You have unsaved changes. Do you want to save before leaving?");
      if (confirmed) {
        await saveEntry(false);
      }
    }
    navigate("/journal");
  };

  return {
    title,
    setTitle,
    content,
    setContent,
    transcribedAudio,
    setTranscribedAudio,
    audioUrl,
    setAudioUrl,
    isSaving,
    isInitializing,
    isSaveInProgress,
    hasUnsavedChanges,
    saveEntry,
    handleNavigateAway
  };
};
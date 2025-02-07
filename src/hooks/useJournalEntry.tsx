
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useJournalLoad } from "./journal/useJournalLoad";
import { useUnsavedChanges } from "./journal/useUnsavedChanges";
import { useTagManagement } from "./useTagManagement";

export const useJournalEntry = (id?: string) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [transcribedAudio, setTranscribedAudio] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveInProgress, setIsSaveInProgress] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [hasBeenSavedBefore, setHasBeenSavedBefore] = useState(!!id);
  const [entryId, setEntryId] = useState<string | undefined>(id);
  const [initialContent, setInitialContent] = useState({ 
    title: "", 
    content: "", 
    audioUrl: null as string | null,
    transcribedAudio: "" 
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  const { selectedTags, setSelectedTags, handleTagToggle, updateEntryTagsMutation } = useTagManagement(entryId);

  const { isInitializing } = useJournalLoad({
    id,
    onLoadComplete: (data) => {
      setTitle(data.title);
      setContent(data.content);
      setTranscribedAudio(data.transcribedAudio);
      setAudioUrl(data.audioUrl);
      setSelectedTags(data.tagIds);
      setInitialContent({
        title: data.title,
        content: data.content,
        audioUrl: data.audioUrl,
        transcribedAudio: data.transcribedAudio
      });
    }
  });

  const { hasActualChanges } = useUnsavedChanges({
    title,
    content,
    audioUrl,
    initialContent,
    isInitializing
  });

  const saveEntry = async (isAutoSave = false, force = false) => {
    if (!force && (isInitializing || isSaveInProgress || (!isAutoSave && saveAttempted))) {
      return null;
    }
    
    try {
      setIsSaveInProgress(true);
      if (!isAutoSave) {
        setSaveAttempted(true);
        setIsSaving(true);
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to save your entry",
          variant: "destructive",
        });
        navigate("/auth");
        return null;
      }

      const fullText = transcribedAudio 
        ? `${content}\n\n---\nTranscribed Audio:\n${transcribedAudio}`
        : content;

      const entryData = {
        user_id: session.user.id,
        title: title || `Journal Entry - ${format(new Date(), 'P')}`,
        text: fullText,
        audio_url: audioUrl,
        has_been_edited: hasBeenSavedBefore,
      };

      let savedEntry;
      
      if (hasBeenSavedBefore && entryId) {
        const { data, error: saveError } = await supabase
          .from("journal_entries")
          .update(entryData)
          .eq('id', entryId)
          .select()
          .single();
          
        if (saveError) throw saveError;
        savedEntry = data;
      } else {
        const { data, error: saveError } = await supabase
          .from("journal_entries")
          .insert([entryData])
          .select()
          .single();
          
        if (saveError) throw saveError;
        savedEntry = data;
        setHasBeenSavedBefore(true);
        setEntryId(savedEntry.id);
      }

      // Update tags
      if (savedEntry?.id) {
        await updateEntryTagsMutation.mutateAsync({
          entryId: savedEntry.id,
          tagIds: selectedTags
        });
      }

      setInitialContent({
        title: entryData.title,
        content,
        audioUrl: entryData.audio_url,
        transcribedAudio
      });

      if (!isAutoSave) {
        toast({
          title: "Success",
          description: `Journal entry ${hasBeenSavedBefore ? 'updated' : 'saved'} successfully`,
        });
      }

      return savedEntry;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save journal entry",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaveInProgress(false);
      setIsSaving(false);
    }
  };

  const handleNavigateAway = async () => {
    if (hasActualChanges()) {
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
    saveEntry,
    handleNavigateAway,
    selectedTags,
    handleTagToggle
  };
};

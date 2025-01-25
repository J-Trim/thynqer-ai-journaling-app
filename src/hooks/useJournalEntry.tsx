import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [hasBeenSavedBefore, setHasBeenSavedBefore] = useState(!!id); // Track if entry has been saved before
  const [entryId, setEntryId] = useState<string | undefined>(id); // Track the entry ID
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
          setHasBeenSavedBefore(true);
          setEntryId(entry.id);
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

  const saveEntry = async (isAutoSave = false, force = false) => {
    if (!force && (isInitializing || isSaveInProgress || (!isAutoSave && saveAttempted))) {
      console.log('Save prevented - initialization or save in progress');
      return null;
    }
    
    try {
      setIsSaveInProgress(true);
      if (!isAutoSave) {
        setSaveAttempted(true);
        setIsSaving(true);
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', session ? 'Active' : 'None');

      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        toast({
          title: "Authentication Error",
          description: "Please log in again to save your entry",
          variant: "destructive",
        });
        navigate("/auth");
        return null;
      }

      let finalContent = content;
      
      const fullText = transcribedAudio 
        ? `${finalContent}\n\n---\nTranscribed Audio:\n${transcribedAudio}`
        : finalContent;

      const entryData = {
        user_id: session.user.id,
        title: title || `Journal Entry - ${format(new Date(), 'P')}`,
        text: fullText,
        audio_url: audioUrl,
        has_been_edited: hasBeenSavedBefore,
      };

      console.log(`${hasBeenSavedBefore ? 'Updating' : 'Creating new'} entry:`, entryData);

      let savedEntry;
      
      if (hasBeenSavedBefore && entryId) {
        // Update existing entry
        const { data, error: saveError } = await supabase
          .from("journal_entries")
          .update(entryData)
          .eq('id', entryId)
          .select()
          .single();
          
        if (saveError) throw saveError;
        savedEntry = data;
        console.log('Entry updated successfully:', savedEntry);
      } else {
        // Create new entry
        const { data, error: saveError } = await supabase
          .from("journal_entries")
          .insert([entryData])
          .select()
          .single();
          
        if (saveError) throw saveError;
        savedEntry = data;
        console.log('New entry created successfully:', savedEntry);
        setHasBeenSavedBefore(true);
        setEntryId(savedEntry.id);
      }

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
          description: `Journal entry ${hasBeenSavedBefore ? 'updated' : 'saved'} successfully`,
        });
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
      setIsSaveInProgress(false);
      setIsSaving(false);
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
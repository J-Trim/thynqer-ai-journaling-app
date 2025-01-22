import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, useBeforeUnload } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { UnsavedChangesContext } from "@/contexts/UnsavedChangesContext";
import AutoSave from "./journal/AutoSave";
import AudioHandler from "./journal/AudioHandler";
import { PlayCircle } from "lucide-react";

const JournalEntryForm = () => {
  const { id } = useParams();
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

  useBeforeUnload(
    React.useCallback(
      (event) => {
        if (hasUnsavedChanges) {
          event.preventDefault();
          return (event.returnValue = "You have unsaved changes. Are you sure you want to leave?");
        }
      },
      [hasUnsavedChanges]
    )
  );

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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking auth status in JournalEntryForm...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.error('Auth check error:', error);
          navigate("/auth", { replace: true });
          return;
        }

        console.log('Auth check successful, user:', session.user.id);
      } catch (error) {
        console.error('Unexpected error during auth check:', error);
        navigate("/auth", { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

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

  const saveEntry = async (isAutoSave = false) => {
    if (isInitializing || isSaveInProgress) return;
    
    try {
      setIsSaveInProgress(true);
      setIsSaving(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('You must be logged in to save entries');
      }

      let finalContent = content;
      
      // If there's audio that hasn't been transcribed yet, handle it first
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
          finalContent = content 
            ? `${content}\n\n---\nTranscribed Audio:\n${newTranscribedText}`
            : newTranscribedText;
        }
      } else if (transcribedAudio) {
        // If there's existing transcribed audio, append it to the content
        finalContent = `${content}\n\n---\nTranscribed Audio:\n${transcribedAudio}`;
      }

      const entryData = {
        user_id: user.id,
        title: title || `Journal Entry - ${format(new Date(), 'P')}`,
        text: finalContent,
        audio_url: audioUrl,
        has_been_edited: id ? hasActualChanges() : false,
      };

      const { error: saveError } = id
        ? await supabase
            .from("journal_entries")
            .update(entryData)
            .eq('id', id)
        : await supabase
            .from("journal_entries")
            .insert([entryData]);

      if (saveError) throw saveError;

      setInitialContent({
        title: entryData.title,
        content: content,
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
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save journal entry",
        variant: "destructive",
      });
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

  const handleTranscriptionComplete = (transcribedText: string) => {
    setContent(prev => {
      const newContent = prev ? `${prev}\n\n---\nTranscribed Audio:\n${transcribedText}` : transcribedText;
      return newContent;
    });
  };

  const getAudioUrl = async (audioFileName: string) => {
    try {
      const { data } = supabase.storage
        .from('audio_files')
        .getPublicUrl(audioFileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error in getAudioUrl:', error);
      return null;
    }
  };

  const AudioPlayer = ({ audioFileName }: { audioFileName: string }) => {
    const [publicUrl, setPublicUrl] = useState<string | null>(null);

    useEffect(() => {
      const fetchAudioUrl = async () => {
        const url = await getAudioUrl(audioFileName);
        setPublicUrl(url);
      };

      fetchAudioUrl();
    }, [audioFileName]);

    if (!publicUrl) return null;

    return (
      <div className="flex items-center gap-2 mt-4 p-4 bg-secondary rounded-lg">
        <PlayCircle className="w-6 h-6 text-primary" />
        <audio controls className="w-full">
          <source src={publicUrl} type="audio/webm" />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  };

  // Determine if recording should be allowed
  const canRecord = !id || hasUnsavedChanges;

  if (isInitializing) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-full" />
          <div className="h-40 bg-gray-200 rounded w-full" />
          <div className="h-10 bg-gray-200 rounded w-1/4 ml-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
      <AutoSave
        content={content}
        title={title}
        audioUrl={audioUrl}
        isInitializing={isInitializing}
        isSaveInProgress={isSaveInProgress}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={saveEntry}
      />
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-semibold"
        />
        <Textarea
          placeholder="Start writing your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[200px] resize-y"
        />
        {transcribedAudio && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium mb-2">Transcribed Audio</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {transcribedAudio}
            </p>
          </div>
        )}
        {audioUrl && <AudioPlayer audioFileName={audioUrl} />}
        {canRecord && (
          <AudioHandler
            onAudioSaved={setAudioUrl}
            onTranscriptionComplete={handleTranscriptionComplete}
          />
        )}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={handleNavigateAway}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={() => saveEntry(false)}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JournalEntryForm;
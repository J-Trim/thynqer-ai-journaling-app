import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useBeforeUnload } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import AudioRecorder from "@/components/AudioRecorder";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const AUTO_SAVE_DELAY = 3000; // 3 seconds

const JournalEntryForm = () => {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSaveInProgress, setIsSaveInProgress] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Warn before closing/navigating away with unsaved changes
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

  // Load existing entry if editing
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
          setTitle(entry.title || '');
          setContent(entry.text || '');
          setAudioUrl(entry.audio_url);
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
        
        if (error) {
          console.error('Auth check error:', error);
          toast({
            title: "Authentication Error",
            description: "Please try logging in again",
            variant: "destructive",
          });
          navigate("/auth", { replace: true });
          return;
        }

        if (!session) {
          console.log('No session found, redirecting to auth');
          navigate("/auth", { replace: true });
          return;
        }

        console.log('Auth check successful, user:', session.user.id);
      } catch (error) {
        console.error('Unexpected error during auth check:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      }
    };

    checkAuth();
  }, [navigate, toast]);

  // Track unsaved changes
  useEffect(() => {
    if (!isInitializing) {
      setHasUnsavedChanges(true);
    }
  }, [title, content, audioUrl, isInitializing]);

  // Auto-save functionality
  useEffect(() => {
    if (isInitializing || isSaveInProgress || !hasUnsavedChanges) return;

    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(async () => {
      if (content || title || audioUrl) {
        await saveEntry(true);
      }
    }, AUTO_SAVE_DELAY);

    setAutoSaveTimeout(timeout);

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [content, title, audioUrl, isInitializing, isSaveInProgress, hasUnsavedChanges]);

  const handleAudioSaved = async (audioFileName: string) => {
    setAudioUrl(audioFileName);
    setHasUnsavedChanges(true);
    
    try {
      console.log('Transcribing audio:', audioFileName);
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl: audioFileName }
      });

      if (error) throw error;

      if (data.text) {
        setContent(prev => {
          const newContent = prev ? `${prev}\n\n---\nTranscribed Audio:\n${data.text}` : data.text;
          return newContent;
        });
        
        toast({
          title: "Success",
          description: "Audio transcribed successfully",
        });
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Error",
        description: "Failed to transcribe audio",
        variant: "destructive",
      });
    }
  };

  const saveEntry = async (isAutoSave = false) => {
    if (isInitializing || isSaveInProgress) return;
    
    try {
      setIsSaveInProgress(true);
      setIsSaving(true);
      console.log('Attempting to save entry...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }

      if (!user) {
        console.log('No user found, redirecting to auth');
        throw new Error('You must be logged in to save entries');
      }

      const entryData = {
        user_id: user.id,
        title: title || `Journal Entry - ${format(new Date(), 'P')}`,
        text: content,
        audio_url: audioUrl,
        has_been_edited: id ? true : false,
      };

      console.log('Saving entry data:', { ...entryData, text: content.length + ' chars' });

      const { error: saveError } = id
        ? await supabase
            .from("journal_entries")
            .update(entryData)
            .eq('id', id)
        : await supabase
            .from("journal_entries")
            .insert([entryData]);

      if (saveError) {
        console.error('Error saving entry:', saveError);
        throw saveError;
      }

      console.log('Entry saved successfully');
      setHasUnsavedChanges(false);
      
      if (!isAutoSave) {
        toast({
          title: "Success",
          description: "Journal entry saved successfully",
        });
        navigate("/journal", { replace: true });
      } else {
        toast({
          title: "Auto-saved",
          description: "Draft saved automatically",
        });
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
        <AudioRecorder onAudioSaved={handleAudioSaved} />
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
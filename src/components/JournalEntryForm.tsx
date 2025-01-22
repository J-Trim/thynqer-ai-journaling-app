import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useJournalEntry } from "@/hooks/useJournalEntry";
import EntryHeader from "./journal/EntryHeader";
import EntryContent from "./journal/EntryContent";
import TranscribedSection from "./journal/TranscribedSection";
import ActionButtons from "./journal/ActionButtons";
import LoadingState from "./journal/LoadingState";
import AudioHandler from "./journal/AudioHandler";
import AutoSave from "./journal/AutoSave";
import TagSelector from "./journal/TagSelector";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const JournalEntryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    title,
    setTitle,
    content,
    setContent,
    transcribedAudio,
    audioUrl,
    setAudioUrl,
    isSaving,
    isInitializing,
    isSaveInProgress,
    hasUnsavedChanges,
    saveEntry,
    handleNavigateAway
  } = useJournalEntry(id);

  const [isTranscriptionPending, setIsTranscriptionPending] = useState(false);
  const [audioPublicUrl, setAudioPublicUrl] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Fetch existing tags for this entry
  const { data: entryTags } = useQuery({
    queryKey: ['entry-tags', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('entry_tags')
        .select('tag_id')
        .eq('entry_id', id);

      if (error) throw error;
      return data.map(et => et.tag_id);
    },
    enabled: !!id
  });

  // Update selected tags when entry tags are loaded
  useEffect(() => {
    if (entryTags) {
      setSelectedTags(entryTags);
    }
  }, [entryTags]);

  const updateEntryTagsMutation = useMutation({
    mutationFn: async ({ entryId, tagIds }: { entryId: string, tagIds: string[] }) => {
      // First, remove all existing tags for this entry
      const { error: deleteError } = await supabase
        .from('entry_tags')
        .delete()
        .eq('entry_id', entryId);

      if (deleteError) throw deleteError;

      // Then, insert new tags
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

  useEffect(() => {
    const fetchAudioUrl = async () => {
      if (!audioUrl) {
        setAudioPublicUrl(null);
        return;
      }

      try {
        console.log('Fetching public URL for audio:', audioUrl);
        const { data } = supabase.storage
          .from('audio_files')
          .getPublicUrl(audioUrl);
        
        console.log('Fetched audio public URL:', data.publicUrl);
        setAudioPublicUrl(data.publicUrl);
      } catch (error) {
        console.error('Error fetching audio URL:', error);
        setAudioPublicUrl(null);
      }
    };

    fetchAudioUrl();
  }, [audioUrl]);

  const handleTranscriptionComplete = (transcribedText: string) => {
    setContent(prev => prev || '');
    setIsTranscriptionPending(false);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Determine if recording should be allowed
  const canRecord = !id || hasUnsavedChanges;

  if (isInitializing) {
    return <LoadingState />;
  }

  const handleSave = async (isAutoSave = false) => {
    if (isTranscriptionPending) {
      console.log('Waiting for transcription to complete before saving...');
      return;
    }
    
    const savedEntry = await saveEntry(isAutoSave);
    if (savedEntry && savedEntry.id && selectedTags.length > 0) {
      await updateEntryTagsMutation.mutateAsync({
        entryId: savedEntry.id,
        tagIds: selectedTags
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
      <AutoSave
        content={content}
        title={title}
        audioUrl={audioUrl}
        isInitializing={isInitializing}
        isSaveInProgress={isSaveInProgress}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
      />
      <div className="space-y-4">
        <EntryHeader title={title} onTitleChange={setTitle} />
        <EntryContent content={content} onContentChange={setContent} />
        <TagSelector
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
        />
        {transcribedAudio && <TranscribedSection transcribedAudio={transcribedAudio} />}
        {audioPublicUrl && (
          <div className="mt-4 p-4 bg-secondary rounded-lg">
            <audio controls className="w-full">
              <source src={audioPublicUrl} type="audio/webm" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        {canRecord && (
          <AudioHandler
            onAudioSaved={(url) => {
              setAudioUrl(url);
              setIsTranscriptionPending(true);
            }}
            onTranscriptionComplete={handleTranscriptionComplete}
          />
        )}
        <ActionButtons
          onCancel={handleNavigateAway}
          onSave={() => handleSave(false)}
          isSaving={isSaving || isTranscriptionPending}
        />
      </div>
    </div>
  );
};

export default JournalEntryForm;
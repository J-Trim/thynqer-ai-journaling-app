import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useJournalEntry } from "@/hooks/useJournalEntry";
import Header from "@/components/Header";
import EntryHeader from "./journal/EntryHeader";
import EntryContent from "./journal/EntryContent";
import TranscribedSection from "./journal/TranscribedSection";
import ActionButtons from "./journal/ActionButtons";
import LoadingState from "./journal/LoadingState";
import AudioHandler from "./journal/AudioHandler";
import AudioPlayer from "./journal/AudioPlayer";
import AutoSave from "./journal/AutoSave";
import TagSelector from "./journal/TagSelector";
import { TransformationSelector } from "./journal/TransformationSelector";
import { TransformationsList } from "./journal/TransformationsList";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const JournalEntryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
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
  } = useJournalEntry(id);

  const [isTranscriptionPending, setIsTranscriptionPending] = useState(false);
  const [audioPublicUrl, setAudioPublicUrl] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [isSaveComplete, setIsSaveComplete] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);

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

  useEffect(() => {
    if (entryTags) {
      setSelectedTags(entryTags);
    }
  }, [entryTags]);

  useEffect(() => {
    if (transcribedAudio) {
      // Small delay to ensure content is rendered before animation
      const timer = setTimeout(() => {
        setShowTags(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [transcribedAudio]);

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
    setTranscribedAudio(transcribedText);
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

  const handleSave = async (isAutoSave = false) => {
    if (isTranscriptionPending) {
      console.log('Waiting for transcription to complete before saving...');
      return null;
    }

    if (!isAutoSave) {
      if (saveAttempted || isSaveComplete) {
        console.log('Save already attempted or completed, preventing duplicate save');
        toast({
          title: "Save in Progress",
          description: "Please wait while your entry is being saved...",
        });
        return null;
      }
      setSaveAttempted(true);
    }
    
    try {
      const savedEntry = await saveEntry(isAutoSave);
      if (savedEntry && selectedTags.length > 0) {
        await updateEntryTagsMutation.mutateAsync({
          entryId: savedEntry.id,
          tagIds: selectedTags
        });
      }

      if (!isAutoSave) {
        setIsSaveComplete(true);
        toast({
          title: "Success",
          description: "Journal entry saved successfully",
        });
      }

      return savedEntry;
    } catch (error) {
      console.error('Error saving entry:', error);
      setSaveAttempted(false);
      setIsSaveComplete(false);
      toast({
        title: "Error",
        description: "Failed to save journal entry. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const canRecord = !id || hasUnsavedChanges;

  if (isInitializing) {
    return (
      <>
        <Header />
        <LoadingState />
      </>
    );
  }

  return (
    <>
      <Header />
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
          <EntryContent 
            content={content} 
            transcribedAudio={transcribedAudio}
            onContentChange={setContent} 
          />
          <div 
            className={`transition-opacity duration-800 ${
              showTags ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <TagSelector
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
            />
          </div>
          {(content || transcribedAudio) && (
            <TransformationSelector 
              entryId={id || ''} 
              entryText={content || transcribedAudio || ''} 
              onSaveEntry={!id ? handleSave : undefined}
            />
          )}
          {id && <TransformationsList entryId={id} />}
          {audioUrl && !showAudioPlayer && (
            <Button 
              variant="outline" 
              onClick={() => setShowAudioPlayer(true)}
              className="w-full"
            >
              Load Audio Player
            </Button>
          )}
          {audioPublicUrl && showAudioPlayer && (
            <AudioPlayer audioUrl={audioPublicUrl} />
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
    </>
  );
};

export default JournalEntryForm;

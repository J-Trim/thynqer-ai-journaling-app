import { useParams } from "react-router-dom";
import { useState } from "react";
import { useJournalEntry } from "@/hooks/useJournalEntry";
import Header from "@/components/Header";
import JournalFormHeader from "./journal/form/JournalFormHeader";
import JournalFormContent from "./journal/form/JournalFormContent";
import JournalFormActions from "./journal/form/JournalFormActions";
import LoadingState from "./journal/LoadingState";
import AudioHandler from "./journal/AudioHandler";
import AudioPlayer from "./journal/AudioPlayer";
import AutoSave from "./journal/AutoSave";
import TagSelector from "./journal/TagSelector";
import { TransformationSelector } from "./journal/TransformationSelector";
import { TransformationsList } from "./journal/TransformationsList";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
  const [transformationEnabled, setTransformationEnabled] = useState(false);

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

  const updateEntryTagsMutation = useMutation({
    mutationFn: async ({ entryId, tagIds }: { entryId: string, tagIds: string[] }) => {
      const { error: deleteError } = await supabase
        .from('entry_tags')
        .delete()
        .eq('entry_id', entryId);

      if (deleteError) throw deleteError;

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
    if (isTranscriptionPending || isSaveInProgress) {
      console.log('Save prevented - transcription or save in progress');
      return null;
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
        setTransformationEnabled(true);
      }

      return savedEntry;
    } catch (error) {
      console.error('Error saving entry:', error);
      return null;
    }
  };

  // New function for forced saves (used by transformation)
  const handleForceSave = async () => {
    try {
      const savedEntry = await saveEntry(false, true);
      if (savedEntry && selectedTags.length > 0) {
        await updateEntryTagsMutation.mutateAsync({
          entryId: savedEntry.id,
          tagIds: selectedTags
        });
      }
      return savedEntry;
    } catch (error) {
      console.error('Error in forced save:', error);
      return null;
    }
  };

  if (isInitializing) {
    return (
      <>
        <Header />
        <LoadingState />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
          <JournalFormHeader 
            title={title}
            onTitleChange={setTitle}
          />
          
          <JournalFormContent
            content={content}
            transcribedAudio={transcribedAudio}
            onContentChange={setContent}
          />

          <div className={`transition-opacity duration-800 ${
            showTags ? 'opacity-100' : 'opacity-0'
          }`}>
            <TagSelector
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
            />
          </div>

          {(content || transcribedAudio) && (
            <div className="mt-8">
              {!transformationEnabled ? (
                <Button 
                  variant="outline" 
                  onClick={() => setTransformationEnabled(true)}
                  className="w-full"
                >
                  Show Transformation Options
                </Button>
              ) : (
                <TransformationSelector 
                  entryId={id || ''} 
                  entryText={content || transcribedAudio || ''} 
                  onSaveEntry={!id ? handleForceSave : undefined}
                />
              )}
            </div>
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

          <AudioHandler
            onAudioSaved={(url) => {
              setAudioUrl(url);
              setIsTranscriptionPending(true);
            }}
            onTranscriptionComplete={handleTranscriptionComplete}
          />

          <JournalFormActions
            onCancel={handleNavigateAway}
            onSave={() => handleSave(false)}
            isSaving={isSaving}
            isTranscriptionPending={isTranscriptionPending}
          />
        </div>
      </div>
    </div>
  );
};

export default JournalEntryForm;
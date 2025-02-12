
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useJournalFormState = (id?: string, initialData?: any) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.text || "");
  const [transcribedAudio, setTranscribedAudio] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(initialData?.audio_url || null);
  const [isTranscriptionPending, setIsTranscriptionPending] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(false);
  const [transformationEnabled, setTransformationEnabled] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(id || null);
  const [mood, setMood] = useState<number | null>(initialData?.mood || null);
  const queryClient = useQueryClient();

  // Reset form state
  const resetForm = () => {
    setTitle("");
    setContent("");
    setTranscribedAudio("");
    setAudioUrl(null);
    setIsTranscriptionPending(false);
    setSelectedTags([]);
    setShowTags(false);
    setTransformationEnabled(false);
    setLastSavedId(null);
    setMood(null);
  };

  // Handle content reordering
  const handleReorder = (newContent: string) => {
    setContent(newContent);
  };

  // Load initial data when editing an existing entry
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setContent(initialData.text || "");
      setAudioUrl(initialData.audio_url || null);
      setMood(initialData.mood || null);
      setLastSavedId(id || null);

      // If there are initial tags, set them
      if (initialData.tagIds) {
        setSelectedTags(initialData.tagIds);
      }
    }
  }, [initialData, id]);

  // Prefetch related data when an entry is loaded
  useEffect(() => {
    if (id) {
      // Prefetch tags data
      queryClient.prefetchQuery({
        queryKey: ['entry-tags', id],
        queryFn: async () => {
          const { data: entryTags } = await supabase
            .from('entry_tags')
            .select(`
              tag_id,
              tags:tags(name)
            `)
            .eq('entry_id', id);
          return entryTags || [];
        }
      });
    }
  }, [id, queryClient]);

  return {
    title,
    setTitle,
    content,
    setContent,
    handleReorder,
    transcribedAudio,
    setTranscribedAudio,
    audioUrl,
    setAudioUrl,
    isTranscriptionPending,
    setIsTranscriptionPending,
    selectedTags,
    setSelectedTags,
    showTags,
    setShowTags,
    transformationEnabled,
    setTransformationEnabled,
    lastSavedId,
    setLastSavedId,
    mood,
    setMood,
    resetForm,
  };
};

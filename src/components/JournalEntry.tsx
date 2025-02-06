import React from "react";
import AudioPlayer from "./journal/AudioPlayer";
import EntryCard from "./journal/entry/EntryCard";
import EntryHeader from "./journal/entry/EntryHeader";
import EntryPreview from "./journal/entry/EntryPreview";
import DeleteDialog from "./journal/entry/DeleteDialog";
import { useJournalDelete } from "@/hooks/useJournalDelete";
import { useEntryAudio } from "./journal/entry/useEntryAudio";

interface JournalEntryProps {
  id: string;
  title: string;
  date: string;
  preview: string;
  audioUrl?: string | null;
  hasBeenEdited?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

const JournalEntry = React.memo(({ 
  id, 
  title, 
  date, 
  preview, 
  audioUrl,
  hasBeenEdited, 
  onClick, 
  onDelete 
}: JournalEntryProps) => {
  const { showDeleteDialog, setShowDeleteDialog, handleDelete } = useJournalDelete(onDelete);
  const { showAudioPlayer, handleAudioClick } = useEntryAudio(audioUrl);

  console.log(`JournalEntry ${id} rendered with:`, {
    title,
    preview,
    audioUrl,
    hasBeenEdited,
    previewLength: preview?.length || 0,
    isPreviewEmpty: !preview || preview.trim() === ''
  });

  const confirmDelete = async () => {
    await handleDelete(id);
  };

  const audioPlayer = showAudioPlayer && audioUrl ? (
    <AudioPlayer audioUrl={audioUrl} />
  ) : null;

  return (
    <>
      <EntryCard id={id} title={title} preview={preview} onClick={onClick}>
        <EntryHeader
          title={title}
          date={date}
          hasBeenEdited={hasBeenEdited}
          hasAudio={!!audioUrl}
          onAudioClick={handleAudioClick}
          onDeleteClick={(e) => {
            e.stopPropagation();
            setShowDeleteDialog(true);
          }}
        />
        <EntryPreview preview={preview} audioPlayer={audioPlayer} />
      </EntryCard>

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
});

JournalEntry.displayName = "JournalEntry";

export default JournalEntry;
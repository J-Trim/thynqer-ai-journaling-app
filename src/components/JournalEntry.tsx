
import React from "react";
import { Smile, Meh, Frown } from "lucide-react";
import AudioPlayer from "./journal/AudioPlayer";
import EntryCard from "./journal/entry/EntryCard";
import EntryHeader from "./journal/entry/EntryHeader";
import EntryPreview from "./journal/entry/EntryPreview";
import DeleteDialog from "./journal/entry/DeleteDialog";
import { useJournalDelete } from "@/hooks/useJournalDelete";
import { useEntryAudio } from "./journal/entry/useEntryAudio";
import { useToast } from "@/hooks/use-toast";

interface JournalEntryProps {
  id: string;
  title: string;
  date: string;
  preview: string;
  audioUrl?: string | null;
  hasBeenEdited?: boolean;
  mood?: number | null;
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
  mood,
  onClick, 
  onDelete 
}: JournalEntryProps) => {
  const { toast } = useToast();
  const { showDeleteDialog, setShowDeleteDialog, handleDelete } = useJournalDelete(onDelete);
  const { showAudioPlayer, handleAudioClick, error: audioError } = useEntryAudio(audioUrl);

  React.useEffect(() => {
    if (audioError) {
      toast({
        title: "Audio Error",
        description: "Failed to load audio file. Please try again.",
        variant: "destructive",
      });
    }
  }, [audioError, toast]);

  const getMoodIcon = () => {
    if (!mood) return null;
    if (mood <= 2) return <Frown className="w-5 h-5 text-red-500" />;
    if (mood <= 4) return <Meh className="w-5 h-5 text-yellow-500" />;
    return <Smile className="w-5 h-5 text-green-500" />;
  };

  const confirmDelete = async () => {
    try {
      await handleDelete(id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete entry. Please try again.",
        variant: "destructive",
      });
    }
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
          moodIcon={getMoodIcon()}
        />
        <EntryPreview preview={preview} audioPlayer={audioPlayer} entryId={id} />
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

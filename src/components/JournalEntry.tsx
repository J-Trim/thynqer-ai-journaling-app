import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, AudioLines } from "lucide-react";
import AudioPlayer from "./journal/AudioPlayer";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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

const JournalEntry = ({ 
  id, 
  title, 
  date, 
  preview, 
  audioUrl,
  hasBeenEdited, 
  onClick, 
  onDelete 
}: JournalEntryProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const { toast } = useToast();

  console.log(`JournalEntry ${id} rendered:`, {
    title,
    audioUrl,
    hasAudio: Boolean(audioUrl),
    showAudioPlayer
  });

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Audio button clicked for entry ${id}:`, {
      audioUrl,
      currentShowAudioPlayer: showAudioPlayer,
      willShow: !showAudioPlayer
    });
    setShowAudioPlayer(!showAudioPlayer);
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Entry deleted",
        description: "Your journal entry has been deleted successfully.",
      });

      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete the journal entry.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card 
        className="hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white relative"
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-text">{title}</CardTitle>
            <div className="flex items-center gap-2">
              {hasBeenEdited && (
                <Badge variant="secondary" className="ml-2">
                  Edited
                </Badge>
              )}
              {audioUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAudioClick}
                  className="hover:bg-secondary"
                >
                  <AudioLines className="h-4 w-4 text-text-muted" />
                </Button>
              )}
              <div className="relative">
                <div className="absolute -top-2 -right-2 w-8 h-8 group">
                  <button
                    onClick={handleDelete}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-secondary rounded-full absolute top-0 right-0"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-4 w-4 text-text-muted hover:text-destructive transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-text-muted">{date}</p>
        </CardHeader>
        <CardContent>
          <p className="text-text-muted line-clamp-2">{preview}</p>
          {showAudioPlayer && audioUrl && (
            <div className="mt-4" onClick={(e) => e.stopPropagation()}>
              <AudioPlayer audioUrl={audioUrl} />
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your journal entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default JournalEntry;
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
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
  hasBeenEdited?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

const JournalEntry = ({ id, title, date, preview, hasBeenEdited, onClick, onDelete }: JournalEntryProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const { toast } = useToast();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setShowDeleteDialog(true);
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
        className="hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white relative group"
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
              <button
                onClick={handleDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-secondary rounded-full"
                aria-label="Delete entry"
              >
                <Trash2 className="h-4 w-4 text-text-muted hover:text-destructive transition-colors" />
              </button>
            </div>
          </div>
          <p className="text-sm text-text-muted">{date}</p>
        </CardHeader>
        <CardContent>
          <p className="text-text-muted line-clamp-2">{preview}</p>
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
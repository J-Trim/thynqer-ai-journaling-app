import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useJournalDelete = (onDeleteSuccess?: () => void) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
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

      if (onDeleteSuccess) {
        onDeleteSuccess();
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

  return {
    showDeleteDialog,
    setShowDeleteDialog,
    handleDelete
  };
};
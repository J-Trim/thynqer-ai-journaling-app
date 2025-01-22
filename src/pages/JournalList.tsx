import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import JournalEntry from "@/components/JournalEntry";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const JournalList = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("");
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const { data: entries, isLoading, refetch } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      console.log('Fetching journal entries...');
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entries:', error);
        throw error;
      }

      // Remove any potential duplicates by using Set with unique IDs
      const uniqueEntries = Array.from(
        new Map(entries?.map(entry => [entry.id, entry])).values()
      );

      console.log('Fetched unique entries:', uniqueEntries);
      return uniqueEntries;
    }
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserName(user.email.split('@')[0]);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    getUser();
  }, []);

  const handleEntryClick = (entryId: string) => {
    navigate(`/journal/edit/${entryId}`);
  };

  const handleDeleteClick = (entry: { id: string; title: string }) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
    setDeleteConfirmation("");
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete || deleteConfirmation !== "DELETE") {
      return;
    }

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Journal entry deleted successfully",
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete journal entry",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      setDeleteConfirmation("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
              <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold">Welcome, {userName}!</h2>
            <p className="text-muted-foreground">Your journal entries</p>
            <Button 
              onClick={() => navigate("/journal/new")} 
              className="mt-4"
              size="lg"
            >
              <PlusCircle className="mr-2" />
              New Journal Entry
            </Button>
          </div>

          <div className="grid gap-4 mt-8">
            {entries && entries.length > 0 ? (
              entries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-4">
                  <JournalEntry
                    title={entry.title || "Untitled Entry"}
                    date={format(new Date(entry.created_at), 'PPP')}
                    preview={entry.text || "No content"}
                    hasBeenEdited={entry.has_been_edited}
                    onClick={() => handleEntryClick(entry.id)}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick({ id: entry.id, title: entry.title || "Untitled Entry" });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg text-muted-foreground">No journal entries yet</p>
                <p className="text-sm text-muted-foreground/75">Click the button above to create your first entry</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your journal entry
              <span className="font-medium"> "{entryToDelete?.title}"</span>.
              <br /><br />
              Please type <span className="font-medium">DELETE</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4">
            <Input
              placeholder="Type DELETE to confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
            />
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmation !== "DELETE"}
            >
              Delete Entry
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JournalList;
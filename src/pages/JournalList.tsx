import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen, Tags } from "lucide-react";
import { useNavigate } from "react-router-dom";
import JournalEntry from "@/components/JournalEntry";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const JournalList = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("");
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ['journal-entries', selectedTags],
    queryFn: async () => {
      try {
        console.log('Starting journal entries fetch in JournalList...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No session found during fetch in JournalList');
          throw new Error('Not authenticated');
        }

        console.log('Fetching entries for user:', session.user.id);
        let query = supabase
          .from('journal_entries')
          .select(`
            *,
            entry_tags (
              tag_id
            )
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (selectedTags.length > 0) {
          query = query.in('entry_tags.tag_id', selectedTags);
        }

        const { data: entries, error } = await query;

        if (error) {
          console.error('Error fetching entries:', error);
          throw error;
        }

        console.log('Raw entries from database:', entries);

        // Remove any potential duplicates by using Set with unique IDs
        const uniqueEntries = Array.from(
          new Map(entries?.map(entry => [entry.id, entry])).values()
        );

        console.log('Fetched unique entries:', uniqueEntries);
        return uniqueEntries;
      } catch (error) {
        console.error('Error in journal entries query:', error);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
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

  const handleEntryDelete = () => {
    // Invalidate and refetch the journal entries query
    queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
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
            <div className="flex justify-center gap-4 mt-4">
              <Button 
                onClick={() => navigate("/journal/new")} 
                size="lg"
              >
                <PlusCircle className="mr-2" />
                New Journal Entry
              </Button>
              <Button 
                onClick={() => navigate("/tags")} 
                variant="outline"
                size="lg"
              >
                <Tags className="mr-2" />
                Manage Tags
              </Button>
            </div>
          </div>

          {tags && tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Filter by Tags</h3>
              <ScrollArea className="h-16">
                <div className="space-x-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="grid gap-4 mt-8">
            {entries && entries.length > 0 ? (
              entries.map((entry) => (
                <JournalEntry
                  key={entry.id}
                  id={entry.id}
                  title={entry.title || "Untitled Entry"}
                  date={format(new Date(entry.created_at), 'PPP')}
                  preview={entry.text || "No content"}
                  hasBeenEdited={entry.has_been_edited}
                  onClick={() => navigate(`/journal/edit/${entry.id}`)}
                  onDelete={() => queryClient.invalidateQueries({ queryKey: ['journal-entries'] })}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg text-muted-foreground">
                  {selectedTags.length > 0
                    ? "No entries found with selected tags"
                    : "No journal entries yet"}
                </p>
                <p className="text-sm text-muted-foreground/75">
                  {selectedTags.length > 0
                    ? "Try selecting different tags or clear the filter"
                    : "Click the button above to create your first entry"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default JournalList;
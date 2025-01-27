import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import JournalEntry from "@/components/JournalEntry";
import JournalEntryForm from "@/components/JournalEntryForm";
import LoadingState from "@/components/journal/LoadingState";
import { format } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isNewEntryPage = location.pathname === "/";

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Auth check error:', error);
        navigate("/auth");
        return;
      }
      if (!session) {
        console.log('No authenticated session found, redirecting to auth');
        navigate("/auth");
        return;
      }
      console.log('Authenticated user:', session.user.id);
    };

    checkAuth();
  }, [navigate]);

  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      console.log('Starting journal entries fetch...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found during fetch');
        throw new Error('Not authenticated');
      }

      console.log('Fetching entries for user:', session.user.id);
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching entries:', error);
        throw error;
      }

      console.log('Raw entries from database:', data);
      
      // Create a Map to store unique entries by ID
      const uniqueEntriesMap = new Map();
      
      // Process each entry and only keep the most recent version
      data.forEach(entry => {
        const existingEntry = uniqueEntriesMap.get(entry.id);
        if (!existingEntry || new Date(entry.created_at) > new Date(existingEntry.created_at)) {
          uniqueEntriesMap.set(entry.id, entry);
          console.log(`Processing entry ID ${entry.id}, title: ${entry.title}`);
        } else {
          console.log(`Skipping duplicate entry ID ${entry.id}, older timestamp`);
        }
      });

      const uniqueEntries = Array.from(uniqueEntriesMap.values());
      console.log(`Found ${data.length} total entries, reduced to ${uniqueEntries.length} unique entries`);
      console.log('Final unique entries:', uniqueEntries);
      
      return uniqueEntries;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  if (error) {
    console.error('Error in journal entries query:', error);
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-4 md:p-8">
          <div className="text-center text-destructive">
            Error loading journal entries. Please try refreshing the page.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <JournalEntryForm />

          {!isNewEntryPage && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Recent Entries</h2>
              {isLoading ? (
                <LoadingState />
              ) : (
                <div className="space-y-4">
                  {entries && entries.length > 0 ? (
                    entries.map((entry) => (
                      <JournalEntry
                        key={entry.id}
                        id={entry.id}
                        title={entry.title || "Untitled Entry"}
                        date={format(new Date(entry.created_at), 'MMMM d, yyyy')}
                        preview={entry.text || "No content"}
                        audioUrl={entry.audio_url}
                        hasBeenEdited={entry.has_been_edited}
                        onClick={() => navigate(`/journal/edit/${entry.id}`)}
                        onDelete={() => {
                          navigate("/");
                          window.location.reload();
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-16 h-16 mx-auto text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold">No journal entries yet</h3>
                      <p className="text-muted-foreground">
                        Click the "New Journal Entry" button above to create your first entry
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
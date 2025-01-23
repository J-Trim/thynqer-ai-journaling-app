import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import JournalEntry from "@/components/JournalEntry";
import Header from "@/components/Header";
import JournalEntryForm from "@/components/JournalEntryForm";
import LoadingState from "@/components/journal/LoadingState";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entries:', error);
        throw error;
      }

      console.log('Retrieved entries:', data);
      return data;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  if (error) {
    console.error('Error in journal entries query:', error);
    return (
      <div className="min-h-screen bg-background">
        <Header />
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
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold">Journal Entry</h2>
            <p className="text-muted-foreground">Capture your thoughts with text and voice</p>
          </div>

          <JournalEntryForm />

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
                      hasBeenEdited={entry.has_been_edited}
                      onClick={() => navigate(`/journal/edit/${entry.id}`)}
                      onDelete={() => {
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
        </div>
      </main>
    </div>
  );
};

export default Index;
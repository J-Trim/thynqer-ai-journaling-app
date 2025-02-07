
import { lazy, Suspense, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Header from "@/components/Header";
import LoadingState from "@/components/journal/LoadingState";
import { useJournalList } from "@/hooks/useJournalList";

// Lazy load components for improved initial load time
const JournalEntry = lazy(() => import("@/components/JournalEntry"));
const JournalHeader = lazy(() => import("@/components/journal/list/JournalHeader"));
const TagFilter = lazy(() => import("@/components/journal/list/TagFilter"));
const EmptyState = lazy(() => import("@/components/journal/list/EmptyState"));
const MoodChart = lazy(() => import("@/components/journal/list/MoodChart"));

// Memoize the entire journal list content to prevent unnecessary rerenders
const JournalListContent = memo(({ 
  entries, 
  hasNextPage, 
  isFetchingNextPage, 
  entriesWithMood,
  isEmpty,
  selectedTags,
  onEntryClick,
  onEntryDelete,
  inViewRef
}: {
  entries: any[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  entriesWithMood: any[];
  isEmpty: boolean;
  selectedTags: string[];
  onEntryClick: (id: string) => void;
  onEntryDelete: () => void;
  inViewRef: (node?: Element | null) => void;
}) => (
  <div className="max-w-4xl mx-auto space-y-8">
    {!isEmpty && entriesWithMood.length > 0 && (
      <MoodChart entries={entriesWithMood} />
    )}

    <div className="grid gap-4 mt-8">
      {isEmpty ? (
        <EmptyState hasTagFilter={selectedTags.length > 0} />
      ) : (
        <>
          {entries.map((entry) => (
            <JournalEntry
              key={entry.id}
              id={entry.id}
              title={entry.title || "Untitled Entry"}
              date={format(new Date(entry.created_at), 'PPP')}
              preview={entry.text || "No content"}
              audioUrl={entry.audio_url}
              hasBeenEdited={entry.has_been_edited}
              mood={entry.mood}
              onClick={() => onEntryClick(entry.id)}
              onDelete={onEntryDelete}
            />
          ))}
          <div ref={inViewRef} className="h-4 w-full">
            {isFetchingNextPage && (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  </div>
));

JournalListContent.displayName = 'JournalListContent';

const JournalList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();

  const {
    userName,
    tags,
    selectedTags,
    handleTagToggle,
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useJournalList();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-4 md:p-8">
          <LoadingState />
        </main>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center text-destructive">
              Error loading journal entries. Please try again later.
            </div>
          </div>
        </main>
      </div>
    );
  }

  const allEntries = data?.pages.flatMap(page => page.entries) || [];
  const isEmpty = allEntries.length === 0;

  // Filter out entries without mood for the chart
  const entriesWithMood = allEntries.filter(entry => entry.mood !== null) as Array<{
    mood: number;
    created_at: string;
  }>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <Suspense fallback={<LoadingState />}>
          <JournalHeader userName={userName} />
          
          <TagFilter 
            tags={tags || []}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
          />

          <JournalListContent 
            entries={allEntries}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            entriesWithMood={entriesWithMood}
            isEmpty={isEmpty}
            selectedTags={selectedTags}
            onEntryClick={(id) => navigate(`/journal/edit/${id}`)}
            onEntryDelete={() => queryClient.invalidateQueries({ queryKey: ['journal-entries'] })}
            inViewRef={ref}
          />
        </Suspense>
      </main>
    </div>
  );
};

export default JournalList;

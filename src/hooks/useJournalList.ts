
import { useEffect, useState, useMemo, useCallback } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ENTRIES_PER_PAGE = 10;

interface JournalEntry {
  id: string;
  title: string;
  text: string;
  created_at: string;
  audio_url: string | null;
  has_been_edited: boolean;
  user_id: string;
  mood: number | null;
}

interface Tag {
  id: string;
  name: string;
}

interface PageData {
  entries: JournalEntry[];
  count: number;
  pageParam: number;
}

export const useJournalList = () => {
  const [userName, setUserName] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Memoize tags query
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Tag[];
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Memoize the fetch function
  const fetchEntries = useCallback(async (context: { pageParam?: number }) => {
    try {
      const pageParam = context.pageParam ?? 0;
      console.log('Fetching page:', pageParam);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found during fetch');
        throw new Error('Not authenticated');
      }

      const start = pageParam * ENTRIES_PER_PAGE;
      const end = start + ENTRIES_PER_PAGE - 1;

      const { data: entriesData, error: entriesError, count } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact' })
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (entriesError) {
        console.error('Error fetching entries:', entriesError);
        throw entriesError;
      }

      if (selectedTags.length > 0) {
        const { data: taggedEntries, error: tagError } = await supabase
          .from('entry_tags')
          .select('entry_id')
          .in('tag_id', selectedTags);

        if (tagError) {
          console.error('Error fetching tagged entries:', tagError);
          throw tagError;
        }

        const taggedEntryIds = new Set(taggedEntries.map(te => te.entry_id));
        const filteredEntries = entriesData?.filter(entry => taggedEntryIds.has(entry.id)) || [];

        return {
          entries: filteredEntries as JournalEntry[],
          count: count || 0,
          pageParam,
        };
      }

      return {
        entries: entriesData as JournalEntry[] || [],
        count: count || 0,
        pageParam,
      };
    } catch (error) {
      console.error('Error in journal entries query:', error);
      throw error;
    }
  }, [selectedTags]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery<PageData, Error>({
    queryKey: ['journal-entries', selectedTags],
    queryFn: fetchEntries,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.count) return undefined;
      const morePages = pages.length * ENTRIES_PER_PAGE < lastPage.count;
      if (!morePages) return undefined;
      return pages.length;
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
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

  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  }, []);

  // Memoize the filtered tags
  const filteredTags = useMemo(() => tags || [], [tags]);

  return {
    userName,
    tags: filteredTags,
    selectedTags,
    handleTagToggle,
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  };
};

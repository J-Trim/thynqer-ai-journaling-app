
import { BookOpen } from "lucide-react";

interface EmptyStateProps {
  hasTagFilter: boolean;
}

const EmptyState = ({ hasTagFilter }: EmptyStateProps) => {
  return (
    <div className="text-center py-12 bg-muted/20 rounded-lg">
      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
      <p className="mt-4 text-lg text-muted-foreground">
        {hasTagFilter
          ? "No entries found with selected tags"
          : "No journal entries yet"}
      </p>
      <p className="text-sm text-muted-foreground/75">
        {hasTagFilter
          ? "Try selecting different tags or clear the filter"
          : "Click the button above to create your first entry"}
      </p>
    </div>
  );
};

export default EmptyState;

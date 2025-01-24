import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface TransformationsListProps {
  entryId: string;
}

export const TransformationsList = ({ entryId }: TransformationsListProps) => {
  const { toast } = useToast();
  const [openStates, setOpenStates] = useState<{ [key: string]: boolean }>({});
  const [transformationToDelete, setTransformationToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const { data: transformations, isLoading } = useQuery({
    queryKey: ['transformations', entryId],
    queryFn: async () => {
      console.log('Fetching transformations for entry:', entryId);
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('entry_id', entryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Retrieved transformations:', data);
      return data;
    },
    enabled: !!entryId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (transformationId: string) => {
      const { error } = await supabase
        .from('summaries')
        .delete()
        .eq('id', transformationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transformations', entryId] });
      toast({
        title: "Transformation deleted",
        description: "The transformation has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting transformation:', error);
      toast({
        title: "Error",
        description: "Failed to delete the transformation.",
        variant: "destructive",
      });
    },
  });

  // Initialize all transformations as open when they are loaded
  useEffect(() => {
    if (transformations) {
      const initialStates = transformations.reduce((acc, transform) => ({
        ...acc,
        [transform.id]: true
      }), {});
      setOpenStates(initialStates);
    }
  }, [transformations]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${type} has been copied to your clipboard.`,
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Failed to copy text to clipboard.",
        variant: "destructive",
      });
    }
  };

  const toggleTransformation = (id: string) => {
    setOpenStates(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDelete = (transformationId: string) => {
    setTransformationToDelete(transformationId);
  };

  const confirmDelete = async () => {
    if (transformationToDelete) {
      await deleteMutation.mutateAsync(transformationToDelete);
      setTransformationToDelete(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading transformations...</div>;
  }

  if (!transformations?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Transformations</h3>
      {transformations.map((transform) => (
        <Collapsible
          key={transform.id}
          open={openStates[transform.id]}
          onOpenChange={() => toggleTransformation(transform.id)}
          className="animate-fade-in"
        >
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center justify-between hover:bg-transparent"
                  >
                    <CardTitle className="text-sm font-medium">
                      {transform.transformation_type}
                    </CardTitle>
                    {openStates[transform.id] ? (
                      <ChevronUp className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(transform.transformed_text, transform.transformation_type)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(transform.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <p className="whitespace-pre-wrap text-sm">
                  {transform.transformed_text}
                </p>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}

      <AlertDialog open={!!transformationToDelete} onOpenChange={() => setTransformationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this transformation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this transformation.
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
    </div>
  );
};
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

interface TransformationItemProps {
  id: string;
  type: string;
  text: string;
  isOpen: boolean;
  onToggle: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

const TransformationItem = ({
  id,
  type,
  text,
  isOpen,
  onToggle,
  onCopy,
  onDelete
}: TransformationItemProps) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        description: "Transformation copied to clipboard",
      });
      onCopy();
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        variant: "destructive",
        description: "Failed to copy to clipboard",
      });
    }
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onToggle}
      className="animate-fade-in"
    >
      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-between hover:bg-transparent w-full"
              >
                <div className="text-sm font-medium">
                  {type}
                </div>
                {isOpen ? (
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
                onClick={handleCopy}
                className="hover:bg-transparent"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="hover:bg-transparent"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <p className="whitespace-pre-wrap text-sm">
              {text}
            </p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default TransformationItem;
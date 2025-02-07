
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const { toast } = useToast();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-4xl font-bold text-center mb-6">Welcome to Thynqer</h1>
      <p className="text-center text-muted-foreground mb-8">
        Your personal journaling companion with AI-powered insights
      </p>
      <div className="flex justify-center">
        <Button onClick={() => navigate("/journal")} size="lg">
          Start Journaling
        </Button>
      </div>
    </div>
  );
}

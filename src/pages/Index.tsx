
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const { toast } = useToast();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-center">Welcome to Thynqer</h1>
    </div>
  );
}

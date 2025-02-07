
import { Button } from "@/components/ui/button";
import { PlusCircle, Tags } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface JournalHeaderProps {
  userName: string;
}

const JournalHeader = ({ userName }: JournalHeaderProps) => {
  const navigate = useNavigate();

  return (
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
  );
};

export default JournalHeader;


import { Smile, Meh, Frown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MoodSelectorProps {
  value: number | null;
  onChange: (value: number) => void;
}

const MoodSelector = ({ value, onChange }: MoodSelectorProps) => {
  const moods = [
    { value: 1, icon: Frown, label: "Bad" },
    { value: 3, icon: Meh, label: "Okay" },
    { value: 5, icon: Smile, label: "Great" }
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">How are you feeling?</label>
      <div className="flex gap-2">
        {moods.map((mood) => {
          const Icon = mood.icon;
          const isSelected = value === mood.value;
          return (
            <Button
              key={mood.value}
              variant={isSelected ? "default" : "outline"}
              size="icon"
              onClick={() => onChange(mood.value)}
              className="w-12 h-12"
            >
              <Icon className="w-6 h-6" />
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default MoodSelector;

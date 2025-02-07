
import { useEffect, useState, memo } from "react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MoodChartProps {
  entries: Array<{
    mood: number | null;
    created_at: string;
  }>;
}

const MoodChart = memo(({ entries }: MoodChartProps) => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const chartData = entries
      .filter(entry => entry.mood !== null)
      .map(entry => ({
        date: format(new Date(entry.created_at), 'MM/dd'),
        mood: entry.mood
      }))
      .slice(-7); // Show last 7 days

    setData(chartData);
  }, [entries]);

  if (data.length === 0) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Mood Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="date" />
              <YAxis domain={[1, 5]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="mood" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

MoodChart.displayName = "MoodChart";

export default MoodChart;

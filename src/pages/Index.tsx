import React from "react";
import AudioRecorder from "@/components/AudioRecorder";
import JournalEntry from "@/components/JournalEntry";

const Index = () => {
  const sampleEntries = [
    {
      title: "Morning Reflection",
      date: "March 19, 2024",
      preview: "Today started with a beautiful sunrise. I took a moment to appreciate the quiet morning and set my intentions for the day..."
    },
    {
      title: "Afternoon Thoughts",
      date: "March 18, 2024",
      preview: "Had an interesting conversation with Sarah about the future of our project. We discussed several new approaches..."
    },
  ];

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-text">Audio Journal</h1>
          <p className="text-text-muted">Capture your thoughts with voice</p>
        </div>

        <AudioRecorder />

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-text">Recent Entries</h2>
          <div className="space-y-4">
            {sampleEntries.map((entry, index) => (
              <JournalEntry
                key={index}
                title={entry.title}
                date={entry.date}
                preview={entry.preview}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
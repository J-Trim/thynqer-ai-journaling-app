CREATE TABLE IF NOT EXISTS code_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name TEXT NOT NULL,
  analysis_result JSONB NOT NULL,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE code_analysis ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view analysis results
CREATE POLICY "Users can view analysis results"
ON code_analysis FOR SELECT
TO authenticated
USING (true);

-- Only allow the edge function to insert analysis results
CREATE POLICY "Edge function can insert analysis results"
ON code_analysis FOR INSERT
TO authenticated
WITH CHECK (true);
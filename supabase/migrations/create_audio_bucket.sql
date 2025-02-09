
-- Create a new storage bucket for audio files
insert into storage.buckets (id, name)
values ('audio_files', 'audio_files');

-- Set up security policies for the audio bucket
create policy "Anyone can upload audio"
  on storage.objects for insert
  with check (bucket_id = 'audio_files');

create policy "Anyone can read audio"
  on storage.objects for select
  using (bucket_id = 'audio_files');

create policy "Owner can delete audio"
  on storage.objects for delete
  using (bucket_id = 'audio_files' AND auth.uid() = owner);

-- Add video generation fields to tasks table
ALTER TABLE tasks ADD COLUMN video_task_id TEXT;
ALTER TABLE tasks ADD COLUMN video_status TEXT DEFAULT 'pending';
ALTER TABLE tasks ADD COLUMN video_url TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_video_task_id ON tasks(video_task_id);

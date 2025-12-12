-- Create action_item_progress table for storing action item completion status
create table if not exists public.action_item_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.diagnostic_sessions(id) on delete cascade not null,
  pattern_id text not null,
  intervention_type text not null check (intervention_type in ('primary', 'secondary')),
  task_text text not null,
  is_completed boolean default false not null,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Composite unique constraint: one entry per task per pattern per session per user
  unique(user_id, session_id, pattern_id, task_text)
);

-- Create index for faster lookups
create index if not exists action_item_progress_user_session_idx 
  on public.action_item_progress(user_id, session_id);

create index if not exists action_item_progress_pattern_idx
  on public.action_item_progress(pattern_id);

-- Enable RLS
alter table public.action_item_progress enable row level security;

-- RLS Policies: Users can only access their own action items
create policy "Users can view their own action items"
  on public.action_item_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own action items"
  on public.action_item_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own action items"
  on public.action_item_progress for update
  using (auth.uid() = user_id);

create policy "Users can delete their own action items"
  on public.action_item_progress for delete
  using (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
create or replace function public.handle_action_item_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at
create trigger set_action_item_updated_at
  before update on public.action_item_progress
  for each row
  execute function public.handle_action_item_updated_at();

-- Comment on table
comment on table public.action_item_progress is 'Stores user progress on action items for diagnostic patterns';

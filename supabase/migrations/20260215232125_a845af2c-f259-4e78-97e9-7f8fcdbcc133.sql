
-- Create chat messages table for persistent AI conversation history
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast retrieval by user
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages (user_id, created_at);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write their own chat messages
CREATE POLICY "Admins can view their own chat messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert their own chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete their own chat messages"
ON public.chat_messages FOR DELETE
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

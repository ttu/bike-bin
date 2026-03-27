-- Enable Supabase Realtime for messages and notifications tables.
-- Without this, postgres_changes subscriptions receive no events.
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

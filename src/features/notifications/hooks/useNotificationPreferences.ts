import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';

export const NOTIFICATION_PREFERENCES_QUERY_KEY = 'notification_preferences';

export interface NotificationCategoryPreferences {
  push: boolean;
  email: boolean;
}

export interface NotificationPreferences {
  messages: NotificationCategoryPreferences;
  borrowActivity: NotificationCategoryPreferences;
  reminders: NotificationCategoryPreferences;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  messages: { push: true, email: true },
  borrowActivity: { push: true, email: true },
  reminders: { push: true, email: false },
};

function parsePreferences(raw: unknown): NotificationPreferences {
  if (!raw || typeof raw !== 'object') return DEFAULT_PREFERENCES;

  const obj = raw as Record<string, unknown>;

  const parseCategory = (
    key: string,
    defaults: NotificationCategoryPreferences,
  ): NotificationCategoryPreferences => {
    const cat = obj[key];
    if (!cat || typeof cat !== 'object') return defaults;
    const c = cat as Record<string, unknown>;
    return {
      push: typeof c.push === 'boolean' ? c.push : defaults.push,
      email: typeof c.email === 'boolean' ? c.email : defaults.email,
    };
  };

  return {
    messages: parseCategory('messages', DEFAULT_PREFERENCES.messages),
    borrowActivity: parseCategory('borrowActivity', DEFAULT_PREFERENCES.borrowActivity),
    reminders: parseCategory('reminders', DEFAULT_PREFERENCES.reminders),
  };
}

/**
 * Read and update the current user's notification preferences
 * stored in `profiles.notification_preferences` jsonb column.
 */
export function useNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [NOTIFICATION_PREFERENCES_QUERY_KEY, user?.id],
    queryFn: async (): Promise<NotificationPreferences> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      return parsePreferences(data?.notification_preferences);
    },
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: async (preferences: NotificationPreferences) => {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: preferences })
        .eq('id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [NOTIFICATION_PREFERENCES_QUERY_KEY],
      });
    },
  });

  return {
    preferences: query.data ?? DEFAULT_PREFERENCES,
    isLoading: query.isLoading,
    updatePreferences: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}

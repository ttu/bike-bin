import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { UserId } from '@/shared/types';

interface SubmitSupportInput {
  userId?: UserId;
  email?: string;
  subject: string;
  body: string;
  screenshotPath?: string;
  appVersion?: string;
  deviceInfo?: string;
}

/**
 * Mutation to insert a support request into the support_requests table.
 * Works for both authenticated and unauthenticated users.
 */
export function useSubmitSupport() {
  return useMutation({
    mutationFn: async (input: SubmitSupportInput) => {
      const { error } = await supabase.from('support_requests').insert({
        user_id: input.userId ?? null,
        email: input.email ?? null,
        subject: input.subject,
        body: input.body,
        screenshot_path: input.screenshotPath ?? null,
        app_version: input.appVersion ?? null,
        device_info: input.deviceInfo ?? null,
        status: 'open',
      });

      if (error) throw error;
    },
  });
}

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { UserId } from '@/shared/types';
import type { ReportTargetType } from '@/shared/types';

interface SubmitReportInput {
  reporterId: UserId;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  text?: string;
}

/**
 * Mutation to insert a report into the reports table.
 * Used from the ReportDialog when reporting a user or item.
 */
export function useReport() {
  return useMutation({
    mutationFn: async (input: SubmitReportInput) => {
      const { error } = await supabase.from('reports').insert({
        reporter_id: input.reporterId,
        target_type: input.targetType,
        target_id: input.targetId,
        reason: input.reason,
        text: input.text ?? null,
        status: 'open',
      });

      if (error) throw error;
    },
  });
}

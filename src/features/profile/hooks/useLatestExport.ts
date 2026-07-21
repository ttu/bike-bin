import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { ExportRequest, ExportRequestId, ExportRequestStatus, UserId } from '@/shared/types';

function mapExportRow(row: Record<string, unknown>): ExportRequest {
  return {
    id: row.id as ExportRequestId,
    userId: row.user_id as UserId,
    status: row.status as ExportRequestStatus,
    storagePath: (row.storage_path as string) ?? undefined,
    errorMessage: (row.error_message as string) ?? undefined,
    expiresAt: (row.expires_at as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useLatestExport(userId: string | undefined) {
  return useQuery({
    queryKey: ['latest-export', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('export_requests')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return mapExportRow(data as Record<string, unknown>);
    },
    enabled: !!userId,
    // eslint-disable-next-line sonarjs/function-return-type -- TanStack's contract is `number | false`; `false` is the only way to stop polling.
    refetchInterval: (query): number | false => {
      const status = query.state.data?.status;
      // Poll every 5s while pending/processing
      if (status === 'pending' || status === 'processing') return 5000;
      return false;
    },
  });
}

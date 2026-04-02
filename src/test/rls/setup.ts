import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Local Supabase — isolated runs set BIKE_BIN_TEST_SUPABASE_URL (see scripts/run-isolated-db-tests.sh)
const SUPABASE_URL = process.env.BIKE_BIN_TEST_SUPABASE_URL ?? 'http://127.0.0.1:54321';
// These are the default local dev keys from `supabase start`, safe to hardcode
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface TestUser {
  id: string;
  email: string;
  client: SupabaseClient;
}

let userCounter = 0;

export async function createTestUser(prefix = 'rls'): Promise<TestUser> {
  userCounter++;
  const email = `${prefix}-${userCounter}-${Date.now()}@test.local`;
  const password = 'test-password-123!';

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) throw new Error(`Failed to create test user: ${authError.message}`);

  const userId = authData.user.id;

  // Update profile row created by trg_create_profile_on_signup trigger
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ display_name: `Test ${prefix} ${userCounter}` })
    .eq('id', userId);
  if (profileError) throw new Error(`Failed to update profile: ${profileError.message}`);

  // Sign in to get a JWT for the user
  const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw new Error(`Failed to sign in test user: ${signInError.message}`);

  // Create an authenticated client using the user's access token
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${signInData.session.access_token}` },
    },
  });

  return { id: userId, email, client };
}

export async function cleanupUsers(users: TestUser[]): Promise<void> {
  for (const user of users) {
    await adminClient.auth.admin.deleteUser(user.id);
  }
}

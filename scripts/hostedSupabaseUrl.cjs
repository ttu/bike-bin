/**
 * Default Supabase API URL for a hosted project (project ref from the dashboard URL hostname).
 */
function supabaseHostedProjectUrl(projectRef) {
  const trimmed = String(projectRef).trim();
  if (!trimmed) {
    throw new Error('projectRef is required');
  }
  return `https://${trimmed}.supabase.co`;
}

module.exports = { supabaseHostedProjectUrl };

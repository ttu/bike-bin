import { supabaseHostedProjectUrl } from '../../../scripts/hostedSupabaseUrl.cjs';

describe('scripts/hostedSupabaseUrl.cjs', () => {
  it('builds the default hosted project URL', () => {
    expect(supabaseHostedProjectUrl('abcdefghijklmnop')).toBe(
      'https://abcdefghijklmnop.supabase.co',
    );
  });

  it('trims whitespace', () => {
    expect(supabaseHostedProjectUrl('  abc  ')).toBe('https://abc.supabase.co');
  });

  it('rejects empty ref', () => {
    expect(() => supabaseHostedProjectUrl('')).toThrow('projectRef is required');
    expect(() => supabaseHostedProjectUrl('   ')).toThrow('projectRef is required');
  });
});

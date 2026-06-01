// Preloaded before the test suite (see bunfig.toml).
// Supplies placeholder Supabase credentials so modules that eagerly construct a
// Supabase client at import time can load. Tests inject mock clients, so these
// values are never used for real network calls.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'test-anon-key'

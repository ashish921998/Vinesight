const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
const missing = required.filter((k) => !process.env[k])
if (missing.length) {
  console.log(`Ops preflight: missing env vars: ${missing.join(', ')}`)
} else {
  console.log('Ops preflight: required env vars present')
}
if (process.env.STRICT_OPS_PREFLIGHT === 'true' && missing.length) {
  process.exit(1)
}

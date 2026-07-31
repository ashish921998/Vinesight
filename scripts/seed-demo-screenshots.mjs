/**
 * Seeds one fictional demo farmer with populated data, so the marketing
 * screenshots on the homepage show a real-looking app instead of zeroes.
 *
 *   node scripts/seed-demo-screenshots.mjs            # dry run, prints the plan
 *   node scripts/seed-demo-screenshots.mjs --apply    # writes to Supabase
 *   node scripts/seed-demo-screenshots.mjs --revert   # deletes everything it created
 *
 * This targets the LIVE project (256 real farms, 61 real workers), so:
 *  - every row hangs off one dedicated demo auth user, never an existing one;
 *  - --apply writes a manifest of created ids, and --revert deletes exactly those;
 *  - it deliberately uses soil_test_records, NOT petiole_test_records, because
 *    petiole inserts fire create_triage_from_petiole_test_trigger and would inject
 *    fake work into the real consultant review queue.
 *
 * All names, rates, and readings below are invented. Do not point this at a real
 * grower's account.
 */

import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'

const MANIFEST = new URL('./.demo-seed-manifest.json', import.meta.url)
const DEMO_EMAIL = 'demo.grower@vinesight.app'

const mode = process.argv.includes('--apply')
  ? 'apply'
  : process.argv.includes('--revert')
    ? 'revert'
    : 'dry'

// --- credentials -----------------------------------------------------------

function loadEnv() {
  const env = {}
  for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key)
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local')
  return { url, key }
}

// --- the demo data ---------------------------------------------------------

const FARM = {
  name: 'Ozar Block A',
  region: 'Nashik',
  area: 4.2,
  crop: 'Grapes',
  crop_variety: 'Thompson Seedless',
  planting_date: '2019-06-15',
  date_of_pruning: '2026-04-10',
  vine_spacing: 5,
  row_spacing: 9,
  latitude: 20.0949,
  longitude: 73.9264,
  location_name: 'Ozar, Nashik, Maharashtra',
  soil_water_retention: 0.18,
  system_discharge: 4.5,
  total_tank_capacity: 60000,
  remaining_water: 41500
}

const WORKERS = [
  { name: 'Sunil Pawar', daily_rate: 420, advance_balance: 0 },
  { name: 'Manda Jadhav', daily_rate: 380, advance_balance: 500 },
  { name: 'Ravi Shinde', daily_rate: 420, advance_balance: 0 },
  { name: 'Kavita More', daily_rate: 380, advance_balance: 0 },
  { name: 'Dattatray Gaikwad', daily_rate: 450, advance_balance: 1000 },
  { name: 'Nanda Bhosale', daily_rate: 380, advance_balance: 0 }
]

// Products taken from the live chemical_products catalog so the rows look real.
const SPRAY_PLAN = [
  ['Antracol (Propineb 70 WP)', '2 g/L', 'Clear'],
  ['Acrobat (Dimethomorph 50 WP)', '1 g/L', 'Humid'],
  ['M45 (Mancozeb 75 WP)', '2.5 g/L', 'Cloudy'],
  ['Revus (Mandipropamide 23.4 SC)', '0.8 ml/L', 'Clear'],
  ['Aliette (Fosetyl-AL 80 WP)', '2 g/L', 'Humid'],
  ['Topgun (Copper Oxychloride)', '3 g/L', 'Clear'],
  ['Karate (Lambda-cyhalothrin 5 EC)', '1 ml/L', 'Clear'],
  ['Confidor (Imidacloprid 17.8 SL)', '0.5 ml/L', 'Cloudy']
]

const STAGES = ['Bud break', 'Flowering', 'Fruit development', 'Berry ripening']

/** Deterministic date N days before 2026-07-31, as YYYY-MM-DD. */
function daysAgo(n) {
  const d = new Date(Date.UTC(2026, 6, 31))
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

function buildRecords(farmId) {
  const sprays = []
  for (let i = 0; i < 22; i++) {
    const [chemical, dose, weather] = SPRAY_PLAN[i % SPRAY_PLAN.length]
    sprays.push({
      farm_id: farmId,
      date: daysAgo(3 + i * 5),
      chemical,
      dose,
      area: FARM.area,
      weather,
      operator: WORKERS[i % WORKERS.length].name,
      water_volume: 500,
      quantity_amount: 1 + (i % 3) * 0.5,
      quantity_unit: 'kg',
      notes: i % 4 === 0 ? 'Preventive round, full block.' : null
    })
  }

  const irrigation = []
  for (let i = 0; i < 16; i++) {
    irrigation.push({
      farm_id: farmId,
      date: daysAgo(2 + i * 6),
      duration: 2 + (i % 3) * 0.5,
      area: FARM.area,
      growth_stage: STAGES[Math.floor(i / 4) % STAGES.length],
      moisture_status: i % 3 === 0 ? 'Dry' : 'Optimal',
      system_discharge: 4.5,
      notes: null
    })
  }

  // Realistic Nashik soil panel: values are in the ranges the app's own
  // in-range/out-of-range banding expects, with a couple deliberately low so
  // the screen shows both states.
  const soil = [
    {
      farm_id: farmId,
      date: daysAgo(28),
      parameters: {
        ph: 7.4,
        ec: 0.42,
        organic_carbon: 0.61,
        nitrogen: 248,
        phosphorus: 31,
        potassium: 402,
        calcium: 2.9,
        magnesium: 1.1,
        sulfur: 14,
        iron: 8.2,
        zinc: 0.62,
        manganese: 6.4,
        copper: 1.9,
        boron: 0.48
      },
      recommendations:
        'Zinc and boron below optimum. Apply chelated Zn at 0.5% and borax at 0.2% as foliar before next growth flush.',
      notes: 'Composite sample, 0-30 cm, six pits across the block.'
    },
    {
      farm_id: farmId,
      date: daysAgo(96),
      parameters: {
        ph: 7.6,
        ec: 0.51,
        organic_carbon: 0.55,
        nitrogen: 216,
        phosphorus: 27,
        potassium: 368,
        calcium: 3.1,
        magnesium: 1.0,
        sulfur: 12,
        iron: 7.1,
        zinc: 0.48,
        manganese: 5.9,
        copper: 1.7,
        boron: 0.39
      },
      recommendations:
        'Maintain current fertigation schedule. Recheck micronutrients after 90 days.',
      notes: 'Pre-pruning baseline.'
    }
  ]

  return { sprays, irrigation, soil }
}

function buildAttendance(workerIds, farmId) {
  const rows = []
  const types = ['pruning', 'spraying', 'weeding', 'irrigation', 'thinning', 'harvesting']
  for (let day = 1; day <= 21; day++) {
    const date = daysAgo(day)
    if (new Date(date + 'T00:00:00Z').getUTCDay() === 0) continue // no Sunday work
    workerIds.forEach((id, idx) => {
      if ((day + idx) % 4 === 0) return // staggered days off
      rows.push({
        worker_id: id,
        date,
        work_status: 'present',
        work_type: types[(day + idx) % types.length],
        farm_ids: [farmId],
        notes: null
      })
    })
  }
  return rows
}

// --- runners ---------------------------------------------------------------

function summarise(records, attendanceCount) {
  console.log(`
Demo user   ${DEMO_EMAIL}
Farm        ${FARM.name} — ${FARM.area} acres, ${FARM.crop_variety}, ${FARM.region}

Would insert:
  farms                1
  workers              ${WORKERS.length}   (${WORKERS.map((w) => w.name).join(', ')})
  worker_attendance    ${attendanceCount}  (21 days, Sundays off, staggered days off)
  spray_records        ${records.sprays.length}  (real catalog products, ~5-day intervals)
  irrigation_records   ${records.irrigation.length}
  soil_test_records    ${records.soil.length}   (NOT petiole — avoids the triage trigger)

Side effects to expect:
  - trg_assign_season_id will create farm_seasons rows for this farm
  - trg_apply_irrigation_water_delta will adjust farms.remaining_water on this farm
  Both are scoped to the demo farm only.
`)
}

async function apply(db) {
  const { data: created, error: userErr } = await db.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { full_name: 'Demo Grower', demo_account: true }
  })
  if (userErr) throw userErr
  const userId = created.user.id
  const manifest = { userId, farmId: null, workerIds: [] }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2))

  const { error: profileErr } = await db.from('profiles').upsert({
    id: userId,
    full_name: 'Demo Grower',
    email: DEMO_EMAIL,
    user_type: 'farmer'
  })
  if (profileErr) throw profileErr

  const { data: farm, error: farmErr } = await db
    .from('farms')
    .insert({ ...FARM, user_id: userId })
    .select('id')
    .single()
  if (farmErr) throw farmErr
  manifest.farmId = farm.id
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2))

  const { data: workers, error: wErr } = await db
    .from('workers')
    .insert(WORKERS.map((w) => ({ ...w, user_id: userId, is_active: true })))
    .select('id')
  if (wErr) throw wErr
  const workerIds = workers.map((w) => w.id)
  manifest.workerIds = workerIds
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2))

  const records = buildRecords(farm.id)
  for (const [table, rows] of [
    ['spray_records', records.sprays],
    ['irrigation_records', records.irrigation],
    ['soil_test_records', records.soil],
    ['worker_attendance', buildAttendance(workerIds, farm.id)]
  ]) {
    const { error } = await db.from(table).insert(rows)
    if (error) throw new Error(`${table}: ${error.message}`)
    console.log(`  inserted ${rows.length} into ${table}`)
  }

  console.log(
    `\nDone. Manifest written. Log in as ${DEMO_EMAIL} (use a password reset to set one).`
  )
}

async function deleteRows(operation, failures) {
  const { error } = await operation
  if (error) failures.push(error.message)
}

async function revert(db) {
  if (!existsSync(MANIFEST)) throw new Error('No manifest found — nothing recorded to revert.')
  const { userId, farmId, workerIds } = JSON.parse(readFileSync(MANIFEST, 'utf8'))
  const failures = []

  // Children first: attendance -> workers, records -> farm_seasons -> farm.
  if (workerIds.length > 0) {
    await deleteRows(db.from('worker_attendance').delete().in('worker_id', workerIds), failures)
    await deleteRows(db.from('workers').delete().in('id', workerIds), failures)
  }
  if (farmId) {
    for (const table of ['spray_records', 'irrigation_records', 'soil_test_records']) {
      await deleteRows(db.from(table).delete().eq('farm_id', farmId), failures)
    }
    await deleteRows(db.from('farm_seasons').delete().eq('farm_id', farmId), failures)
    await deleteRows(db.from('farms').delete().eq('id', farmId), failures)
  }
  await deleteRows(db.from('profiles').delete().eq('id', userId), failures)
  const { error: userErr } = await db.auth.admin.deleteUser(userId)
  if (userErr) failures.push(userErr.message)

  if (failures.length > 0) {
    throw new Error(`Revert incomplete; manifest retained:\n- ${failures.join('\n- ')}`)
  }

  unlinkSync(MANIFEST)
  console.log('Reverted. Verify nothing is left:')
  console.log(`  select count(*) from farms where id = ${farmId};`)
}

const records = buildRecords(0)
const attendanceCount = buildAttendance([1, 2, 3, 4, 5, 6], 0).length

if (mode === 'dry') {
  console.log('DRY RUN — nothing will be written. Re-run with --apply to commit.')
  summarise(records, attendanceCount)
  process.exit(0)
}

const { url, key } = loadEnv()
const db = createClient(url, key, { auth: { persistSession: false } })
console.log(`Target: ${url}`)
if (mode === 'apply') {
  try {
    await apply(db)
  } catch (error) {
    if (existsSync(MANIFEST)) {
      console.error('Apply failed; attempting cleanup from the partial manifest.')
      try {
        await revert(db)
      } catch (cleanupError) {
        console.error(cleanupError)
      }
    }
    throw error
  }
} else {
  await revert(db)
}

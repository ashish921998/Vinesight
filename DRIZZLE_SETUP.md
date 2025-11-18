# Drizzle ORM Integration with Supabase

This project now uses **Drizzle ORM** for database operations while keeping **Supabase** for authentication and real-time features.

## Why Drizzle + Supabase?

### Drizzle handles:
- ✅ Type-safe database queries
- ✅ Better developer experience with SQL-like syntax
- ✅ Schema management and migrations
- ✅ Complex joins and aggregations
- ✅ Excellent TypeScript inference

### Supabase still handles:
- ✅ User authentication (`auth.signIn`, `auth.getUser`, etc.)
- ✅ Real-time subscriptions (farms, tasks updates)
- ✅ Row Level Security policies
- ✅ File storage (for reports, images)

## Setup

### 1. Get Your Database Connection URL

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **Database**
3. Find the **Connection Pooling** section
4. Copy the **Connection string** (use the "Session" mode for better performance)
5. Add it to your `.env.local` file:

```bash
# Add this to .env.local
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
```

**Important:**
- Use **Session pooling mode** (port 6543) for better performance
- If you must use **Transaction pooling mode** (port 6543), prepared statements are already disabled in the config
- Never commit `.env.local` to git!

### 2. Verify Installation

The following packages are already installed:
```json
{
  "dependencies": {
    "drizzle-orm": "^0.44.7",
    "postgres": "^3.4.7",
    "dotenv": "^17.2.3"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.1"
  }
}
```

## Usage

### Option 1: Use DrizzleService (Recommended for New Code)

The `DrizzleService` class provides a clean interface using Drizzle ORM:

```typescript
import { DrizzleService } from '@/lib/drizzle-service'

// Get all farms for current user
const farms = await DrizzleService.getAllFarms()

// Get farm by ID (with ownership check)
const farm = await DrizzleService.getFarmById(farmId)

// Create a new farm
const newFarm = await DrizzleService.createFarm({
  name: 'My Vineyard',
  location: 'Nashik',
  area: 10,
  grapeVariety: 'Thompson Seedless'
})

// Get irrigation records
const records = await DrizzleService.getIrrigationRecords(farmId, 10)

// Add irrigation record
const record = await DrizzleService.addIrrigationRecord({
  farmId: 1,
  date: '2024-01-15',
  duration: 2,
  area: 5,
  growthStage: 'Vegetative',
  moistureStatus: 'Moderate',
  systemDischarge: 1000
})

// Dashboard summary with aggregations
const summary = await DrizzleService.getDashboardSummary(farmId)
```

### Option 2: Use Drizzle Directly (For Custom Queries)

```typescript
import { getDb, eq, and, desc, sql } from '@/lib/db'
import { farms, irrigationRecords } from '@/lib/db/schema'
import { getTypedSupabaseClient } from '@/lib/supabase'

// Get authenticated user
const supabase = getTypedSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()

// Query with Drizzle
const db = getDb()
const userFarms = await db
  .select()
  .from(farms)
  .where(eq(farms.userId, user.id))
  .orderBy(desc(farms.createdAt))

// Complex query with joins
const farmsWithRecords = await db
  .select({
    farmName: farms.name,
    farmArea: farms.area,
    irrigationDate: irrigationRecords.date,
    duration: irrigationRecords.duration
  })
  .from(farms)
  .leftJoin(irrigationRecords, eq(farms.id, irrigationRecords.farmId))
  .where(eq(farms.userId, user.id))
  .limit(10)

// Aggregations
const [result] = await db
  .select({
    totalHarvest: sql<number>`SUM(${harvestRecords.quantity})`
  })
  .from(harvestRecords)
  .where(eq(harvestRecords.farmId, farmId))
```

### Option 3: Continue Using SupabaseService (For Existing Code)

Your existing `SupabaseService` still works! No need to refactor everything at once:

```typescript
import { SupabaseService } from '@/lib/supabase-service'

// Still works exactly as before
const farms = await SupabaseService.getAllFarms()
```

## Migration Strategy

You can gradually migrate from `SupabaseService` to `DrizzleService`:

### Phase 1: New Features (Immediate)
- Use `DrizzleService` for all new features
- Get familiar with Drizzle's query syntax

### Phase 2: High-Value Refactors (When Time Permits)
- Migrate complex queries that would benefit from better type safety
- Replace frequently modified service methods

### Phase 3: Full Migration (Optional)
- Gradually replace remaining `SupabaseService` methods
- Keep Supabase client only for auth and realtime

## Schema Management

### View Current Schema

```bash
npm run db:studio
```

This opens Drizzle Studio - a visual database browser.

### Generate Migrations (Future)

When you modify the schema in `src/lib/db/schema.ts`:

```bash
npm run db:generate
npm run db:migrate
```

**Note:** Since this is an existing Supabase project, we're using Drizzle in "query-only" mode for now. Schema changes should still be made through Supabase migrations or SQL editor to maintain RLS policies.

## Important Notes

### Row Level Security (RLS)

Drizzle respects your Supabase RLS policies when queries include user context. The `DrizzleService` methods automatically filter by `user_id` to maintain security:

```typescript
// Security: Always filter by authenticated user's ID
const farms = await db
  .select()
  .from(farms)
  .where(eq(farms.userId, user.id)) // ← Critical for multi-tenant security
```

### Authentication

**Always use Supabase client for authentication:**

```typescript
// ✅ Correct
import { getTypedSupabaseClient } from '@/lib/supabase'
const supabase = getTypedSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()

// ❌ Don't try to implement auth with Drizzle
```

### Real-time Subscriptions

**Keep using Supabase client for real-time:**

```typescript
// ✅ Correct - use Supabase for real-time
import { getTypedSupabaseClient } from '@/lib/supabase'
const supabase = getTypedSupabaseClient()

supabase
  .channel('farms')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'farms' },
    (payload) => console.log(payload)
  )
  .subscribe()
```

## File Structure

```
src/lib/
├── db/
│   ├── schema.ts           # Drizzle table definitions
│   └── index.ts            # Database connection
├── drizzle-service.ts      # Service layer using Drizzle (NEW)
├── supabase-service.ts     # Service layer using Supabase (EXISTING)
├── supabase.ts             # Supabase client setup
└── supabase-types.ts       # Type converters

drizzle/                    # Migration files (future)
drizzle.config.ts           # Drizzle Kit configuration
```

## Type Safety Benefits

### Before (Supabase Client)
```typescript
// Limited type inference
const { data, error } = await supabase
  .from('farms')
  .select('*')
  .eq('user_id', userId)

// data is any or loosely typed
```

### After (Drizzle)
```typescript
// Full type inference
const farms = await db
  .select()
  .from(farms)
  .where(eq(farms.userId, userId))

// farms is Farm[] with all properties fully typed
// IDE autocomplete for all columns
// Compile-time error if you typo a column name
```

## Troubleshooting

### Connection Error: "DATABASE_URL is not set"
Make sure you've added `DATABASE_URL` to your `.env.local` file.

### Connection Error: "Too many connections"
You might be using Transaction pooling mode. Either:
- Switch to Session pooling mode in Supabase (recommended)
- Reduce `max: 10` to `max: 1` in `src/lib/db/index.ts`

### Type Errors with JSONB columns
JSONB columns (like `chemicals`, `fertilizers`) are typed as `unknown`. Cast them:
```typescript
const chemicals = record.chemicals as Array<{name: string, quantity: number}>
```

### RLS Policy Not Working
Remember: Drizzle doesn't automatically apply RLS. Always filter by `userId`:
```typescript
.where(eq(farms.userId, currentUserId))
```

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Drizzle + Supabase Guide](https://orm.drizzle.team/docs/get-started/supabase-existing)
- [Supabase Database Docs](https://supabase.com/docs/guides/database)

## Questions?

Check the example methods in `src/lib/drizzle-service.ts` for patterns and best practices.

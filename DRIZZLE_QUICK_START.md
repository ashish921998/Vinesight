# Drizzle ORM Quick Start

## Setup (5 minutes)

### 1. Add DATABASE_URL to `.env.local`

```bash
# Get this from Supabase Dashboard > Settings > Database > Connection Pooling
DATABASE_URL="postgresql://postgres.[ref]:[password]@[region].pooler.supabase.com:6543/postgres"
```

### 2. Test the connection

```typescript
import { DrizzleService } from '@/lib/drizzle-service'

// In any server component or API route
const farms = await DrizzleService.getAllFarms()
```

## Common Operations

### Query farms
```typescript
import { DrizzleService } from '@/lib/drizzle-service'

const farms = await DrizzleService.getAllFarms()
const farm = await DrizzleService.getFarmById(1)
```

### Create a farm
```typescript
const newFarm = await DrizzleService.createFarm({
  name: 'My Vineyard',
  location: 'Nashik',
  area: 10
})
```

### Get records
```typescript
const records = await DrizzleService.getIrrigationRecords(farmId, 10)
```

### Add a record
```typescript
const record = await DrizzleService.addIrrigationRecord({
  farmId: 1,
  date: '2024-01-15',
  duration: 2,
  area: 5,
  growthStage: 'Vegetative',
  moistureStatus: 'Moderate',
  systemDischarge: 1000
})
```

### Complex queries (direct Drizzle)
```typescript
import { getDb, eq, desc } from '@/lib/db'
import { farms, irrigationRecords } from '@/lib/db/schema'

const db = getDb()
const result = await db
  .select()
  .from(farms)
  .leftJoin(irrigationRecords, eq(farms.id, irrigationRecords.farmId))
  .where(eq(farms.userId, userId))
```

## Authentication (use Supabase)

```typescript
import { getTypedSupabaseClient } from '@/lib/supabase'

const supabase = getTypedSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()
```

## Real-time (use Supabase)

```typescript
import { getTypedSupabaseClient } from '@/lib/supabase'

const supabase = getTypedSupabaseClient()
supabase
  .channel('farms')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'farms' },
    (payload) => console.log(payload)
  )
  .subscribe()
```

## Migration Path

1. ✅ **Start now**: Use `DrizzleService` for all new features
2. ⏳ **When time permits**: Migrate complex queries from `SupabaseService`
3. 📅 **Future**: Gradually replace remaining methods

## Files Created

- `drizzle.config.ts` - Drizzle configuration
- `src/lib/db/schema.ts` - Database table definitions
- `src/lib/db/index.ts` - Database connection
- `src/lib/drizzle-service.ts` - Service layer with examples
- `DRIZZLE_SETUP.md` - Full documentation
- `DRIZZLE_EXAMPLES.tsx` - Code examples

## Helpful Commands

```bash
npm run db:studio      # Open Drizzle Studio (visual DB browser)
npm run db:generate    # Generate migrations (future)
npm run db:push        # Push schema changes (future)
```

## Need Help?

See `DRIZZLE_SETUP.md` for comprehensive documentation and `DRIZZLE_EXAMPLES.tsx` for code examples.

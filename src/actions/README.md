# Server Actions

This directory contains Next.js server actions for the VineSight application. Server actions provide a more streamlined way to handle server-side operations compared to traditional API routes.

## What are Server Actions?

Server actions are asynchronous functions that run on the server and can be called directly from client or server components. They are marked with the `'use server'` directive.

## Benefits

- **Type-safe**: Direct function calls with full TypeScript support
- **Simpler code**: No need for fetch(), request/response handling
- **Security**: Built-in CSRF protection
- **Revalidation**: Easy cache invalidation with `revalidatePath()`
- **Progressive enhancement**: Works without JavaScript enabled
- **Smaller bundles**: Less client-side code

## Available Actions

### Farm Operations (`farms.ts`)

```typescript
import { createFarm, updateFarm, deleteFarm, getAllFarms, getFarmById } from '@/actions'

// Create a new farm
const result = await createFarm({
  name: 'My Vineyard',
  region: 'Nashik',
  area: 10,
  crop: 'Grapes',
  cropVariety: 'Thompson Seedless',
  plantingDate: '2024-01-01'
})

if (result.success) {
  console.log('Farm created:', result.data)
} else {
  console.error('Error:', result.error)
}

// Update a farm
await updateFarm(farmId, { name: 'Updated Name' })

// Delete a farm
await deleteFarm(farmId)

// Get all farms
const farms = await getAllFarms()

// Get a specific farm
const farm = await getFarmById(farmId)
```

### Task Management (`tasks.ts`)

```typescript
import { createTask, updateTask, deleteTask, completeTask, getTasksByFarm } from '@/actions'

// Create a task
await createTask({
  farmId: 1,
  title: 'Apply fertilizer',
  type: 'fertigation',
  priority: 'high',
  dueDate: '2024-12-31'
})

// Update a task
await updateTask(taskId, { status: 'in_progress' })

// Mark task as completed
await completeTask(taskId)

// Get all tasks for a farm
const tasks = await getTasksByFarm(farmId, ['pending', 'in_progress'])
```

### Record Operations (`records.ts`)

```typescript
import {
  createIrrigationRecord,
  createSprayRecord,
  createHarvestRecord,
  createFertigationRecord,
  createExpenseRecord
} from '@/actions'

// Create irrigation record
await createIrrigationRecord({
  farm_id: 1,
  date: '2024-01-15',
  duration: 2.5,
  area: 10,
  growth_stage: 'flowering',
  moisture_status: 'moderate',
  system_discharge: 500
})

// Create spray record
await createSprayRecord({
  farm_id: 1,
  date: '2024-01-15',
  pest_disease: 'Powdery Mildew',
  chemical: 'Sulfur',
  dose: '2kg/acre',
  area: 10,
  weather: 'Sunny',
  operator: 'John Doe'
})

// Similar patterns for harvest, fertigation, and expense records
```

### Test Records & Notes (`tests-and-notes.ts`)

```typescript
import {
  createSoilTestRecord,
  createPetioleTestRecord,
  createDailyNote
} from '@/actions'

// Create soil test record
await createSoilTestRecord({
  farm_id: 1,
  date: '2024-01-15',
  parameters: {
    pH: 6.5,
    N: 45,
    P: 23,
    K: 180
  },
  recommendations: 'Apply potassium fertilizer'
})

// Create daily note
await createDailyNote({
  farm_id: 1,
  date: '2024-01-15',
  notes: 'Observed some leaf discoloration'
})
```

### File Uploads (`uploads.ts`)

```typescript
import { uploadTestReport, getSignedUploadUrl } from '@/actions'

// Upload and parse a test report
const formData = new FormData()
formData.append('file', file)
formData.append('testType', 'soil')
formData.append('farmId', '1')

const result = await uploadTestReport(formData)

if (result.success) {
  console.log('Report:', result.report)
  console.log('Extracted data:', result.extraction)
}

// Get signed URL for existing file
const urlResult = await getSignedUploadUrl('soil/1/report.pdf')
if (urlResult.success) {
  console.log('Signed URL:', urlResult.signedUrl)
}
```

### AI Insights (`ai-insights.ts`)

```typescript
import {
  generateWeatherInsights,
  generateFinancialAnalysis,
  generateGrowthAnalysis
} from '@/actions'

// Generate weather insights
const weatherInsights = await generateWeatherInsights({
  weatherData: {
    temperature: 28,
    humidity: 65,
    wind_speed: 10,
    precipitation: 0
  },
  farmData: { region: 'Nashik' },
  history: recentActivities
})

// Generate financial analysis
const financialAnalysis = await generateFinancialAnalysis({
  expenses: recentExpenses,
  historicalData: historicalExpenses
})

// Generate growth analysis
const growthAnalysis = await generateGrowthAnalysis({
  farmData: farm,
  activities: recentActivities
})
```

## Usage in Components

### Client Components

```typescript
'use client'

import { createFarm } from '@/actions'
import { useState } from 'react'

export function FarmForm() {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createFarm({
      name: formData.get('name') as string,
      region: formData.get('region') as string,
      area: Number(formData.get('area')),
      crop: formData.get('crop') as string,
      cropVariety: formData.get('cropVariety') as string,
      plantingDate: formData.get('plantingDate') as string
    })

    if (result.success) {
      // Handle success
      console.log('Farm created!')
    } else {
      // Handle error
      console.error(result.error)
    }

    setLoading(false)
  }

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>
}
```

### Server Components

```typescript
import { getAllFarms } from '@/actions'

export default async function FarmsPage() {
  const result = await getAllFarms()

  if (!result.success) {
    return <div>Error loading farms</div>
  }

  return (
    <div>
      {result.data.map((farm) => (
        <div key={farm.id}>{farm.name}</div>
      ))}
    </div>
  )
}
```

### With Form Actions (Progressive Enhancement)

```typescript
'use client'

import { createFarm } from '@/actions'
import { useFormState, useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending}>
      {pending ? 'Creating...' : 'Create Farm'}
    </button>
  )
}

export function FarmForm() {
  async function action(prevState: any, formData: FormData) {
    const result = await createFarm({
      name: formData.get('name') as string,
      region: formData.get('region') as string,
      area: Number(formData.get('area')),
      crop: formData.get('crop') as string,
      cropVariety: formData.get('cropVariety') as string,
      plantingDate: formData.get('plantingDate') as string
    })

    return result
  }

  const [state, formAction] = useFormState(action, null)

  return (
    <form action={formAction}>
      {/* form fields */}
      <SubmitButton />
      {state?.error && <p className="error">{state.error}</p>}
    </form>
  )
}
```

## Response Format

All server actions return a consistent response format:

### Success Response

```typescript
{
  success: true,
  data: T // The returned data
}
```

### Error Response

```typescript
{
  success: false,
  error: string // Error message
}
```

### Validation Error Response

```typescript
{
  success: false,
  error: string,
  details: string[] // Array of validation errors
}
```

## Error Handling

Server actions handle errors gracefully and return structured error responses:

```typescript
const result = await createFarm(farmData)

if (!result.success) {
  // Handle error
  console.error(result.error)

  // Check for validation errors
  if ('details' in result) {
    console.error('Validation errors:', result.details)
  }

  return
}

// Success - use result.data
console.log('Farm created:', result.data)
```

## Security

All server actions include:

- **Authentication checks**: Verify user is logged in
- **Authorization checks**: Verify user owns the resource
- **Input validation**: Using Zod schemas
- **Sanitization**: XSS and SQL injection prevention
- **Rate limiting**: Via existing rate limiter
- **Path revalidation**: Automatic cache clearing

## Migration from API Routes

### Before (API Route)

```typescript
// Component
const response = await fetch('/api/farms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(farmData)
})

const data = await response.json()
```

### After (Server Action)

```typescript
// Component
import { createFarm } from '@/actions'

const result = await createFarm(farmData)
```

Much simpler, type-safe, and less code!

## Best Practices

1. **Always check the `success` property** before using `data`
2. **Handle errors gracefully** with user-friendly messages
3. **Use loading states** to provide feedback during operations
4. **Leverage revalidation** to keep data fresh
5. **Keep actions focused** - one action per operation
6. **Use TypeScript** for full type safety
7. **Test thoroughly** - server actions run in a different context

## Testing

Server actions can be tested like regular async functions:

```typescript
import { createFarm } from '@/actions/farms'

describe('createFarm', () => {
  it('should create a farm successfully', async () => {
    const result = await createFarm({
      name: 'Test Farm',
      region: 'Nashik',
      area: 10,
      crop: 'Grapes',
      cropVariety: 'Thompson Seedless',
      plantingDate: '2024-01-01'
    })

    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('id')
  })
})
```

## Additional Resources

- [Next.js Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Form Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/forms-and-mutations)
- [Progressive Enhancement](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#progressive-enhancement)

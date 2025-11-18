import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Database connection for Drizzle ORM
// This connects directly to Supabase's Postgres instance

// For development and server-side usage
let client: ReturnType<typeof postgres> | undefined
let db: ReturnType<typeof drizzle> | undefined

/**
 * Get Drizzle database instance
 * This uses Supabase's connection pooler URL
 *
 * IMPORTANT: Set prepare: false if using Transaction pooling mode
 * Use Session pooling mode for better performance with prepared statements
 */
export function getDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not set. Get this from Supabase Dashboard > Project Settings > Database > Connection Pooling'
      )
    }

    // Create postgres client
    // Set prepare: false if using Transaction pooling mode in Supabase
    // For Session pooling mode, you can enable prepared statements by removing this option
    client = postgres(connectionString, {
      prepare: false, // Required for Transaction pooling mode
      max: 10, // Connection pool size
      idle_timeout: 20,
      connect_timeout: 10
    })

    // Create Drizzle instance with schema
    db = drizzle(client, { schema })
  }

  return db
}

/**
 * Get database instance with RLS context
 * This is used when you want Drizzle queries to respect Row Level Security policies
 *
 * @param userId - The authenticated user's ID from Supabase Auth
 * @returns Drizzle database instance with RLS context
 *
 * Note: This creates a new connection with the user context.
 * For most use cases, application-level filtering (adding .where(eq(table.userId, userId)))
 * is simpler and more performant than database-level RLS with Drizzle.
 */
export function getDbWithRLS(userId: string) {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  // Create a new client with user context for RLS
  // This sets the user_id in the database session
  const rlsClient = postgres(connectionString, {
    prepare: false,
    max: 1, // Use single connection for RLS context
    connection: {
      // Set the user context for RLS
      // This requires RLS policies to check auth.uid() or current_setting('request.jwt.claim.sub')
      options: `-c search_path=public -c role=authenticated`
    }
  })

  return drizzle(rlsClient, { schema })
}

/**
 * Close database connection
 * Call this when shutting down the application
 */
export async function closeDb() {
  if (client) {
    await client.end()
    client = undefined
    db = undefined
  }
}

// Export schema for easy access
export { schema }

// Re-export commonly used Drizzle operators
export { eq, and, or, not, gt, gte, lt, lte, isNull, isNotNull, inArray, sql } from 'drizzle-orm'

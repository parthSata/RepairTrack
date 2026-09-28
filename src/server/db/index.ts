import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

// Drizzle runs every query through `sql.unsafe()`, which is unprepared by default. An unprepared
// parameterized query costs two network round-trips (describe, then execute); a prepared one costs
// one after first use. Neon's pooler supports protocol-level prepared statements.
function preferPreparedStatements(sql: postgres.Sql): postgres.Sql {
  const unsafe = sql.unsafe
  sql.unsafe = ((query: string, args?: unknown, options?: postgres.UnsafeQueryOptions) => {
    if (args !== undefined && !Array.isArray(args)) {
      return unsafe(query, [], { prepare: true, ...(args as postgres.UnsafeQueryOptions) })
    }
    return unsafe(query, (args ?? []) as postgres.ParameterOrJSON<never>[], { prepare: true, ...options })
  }) as typeof sql.unsafe
  return sql
}

function createConnection(): postgres.Sql {
  return preferPreparedStatements(
    postgres(process.env.DATABASE_URL!, {
      prepare: true,
      max: 10,
      // Opening a TLS connection to Neon costs several round-trips (seconds from far regions),
      // so keep idle connections around instead of reconnecting after short pauses.
      idle_timeout: 600,
      connect_timeout: 10,
    }),
  )
}

const connection = globalForDb.conn ?? createConnection()

if (process.env.NODE_ENV !== 'production') {
  globalForDb.conn = connection
}

export const db = drizzle(connection, { schema })

export type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0]
export type DbClient = typeof db | TxClient

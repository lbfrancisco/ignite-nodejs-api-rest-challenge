import { knex as setupKnex, Knex } from 'knex'
import { env } from './env'

console.log(env)

export const config: Knex.Config = {
  client: env.DATABASE_CLIENT,
  connection:
    env.DATABASE_CLIENT === 'pg'
      ? env.DATABASE_URL
      : { filename: env.DATABASE_URL },
  useNullAsDefault: true,
  migrations: {
    directory: './db/migrations',
    extension: 'ts',
  },
}

export const knex = setupKnex(config)

import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').defaultTo(knex.fn.uuid()).primary().notNullable()
    table.string('session_id').notNullable().unique()
    table.string('name').notNullable()
    table.string('email').notNullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users')
}

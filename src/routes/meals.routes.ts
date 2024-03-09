import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const meals = await knex('meals')
      .where({ user_id: request.user?.id })
      .orderBy('date', 'asc')

    return { meals }
  })

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const createParamsSchema = z.object({ id: z.string().uuid() })

    const { id } = createParamsSchema.parse(request.params)

    const meal = await knex('meals').where({ id, user_id: request.user?.id })

    return { meal }
  })

  app.get(
    '/metrics',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const meals = await knex('meals').where({
        user_id: request.user?.id,
      })

      const totalMealsOnDiet = await knex('meals')
        .where({
          user_id: request.user?.id,
          is_on_diet: true,
        })
        .count('id', { as: 'count' })

      const totalMealsOutOfDiet = await knex('meals')
        .where({
          user_id: request.user?.id,
          is_on_diet: false,
        })
        .count('id', { as: 'count' })

      const bestSequenceOnDiet = meals.reduce(
        (acc, meal) => {
          if (meal.is_on_diet) {
            acc.currentSequence++
          } else {
            acc.currentSequence = 0
          }

          if (acc.currentSequence > acc.bestSequence) {
            acc.bestSequence = acc.currentSequence
          }

          return acc
        },
        { bestSequence: 0, currentSequence: 0 },
      )

      return reply.send({
        totalMeals: meals.length,
        totalMealsOnDiet: totalMealsOnDiet[0].count,
        totalMealsOutOfDiet: totalMealsOutOfDiet[0].count,
        bestSequenceOnDiet,
      })
    },
  )

  app.post(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isOnDiet: z.boolean(),
        date: z.coerce.date(),
      })

      const { name, description, isOnDiet, date } = createMealBodySchema.parse(
        request.body,
      )

      await knex('meals').insert({
        user_id: request.user?.id,
        name,
        description,
        is_on_diet: isOnDiet,
        date: date.getTime(),
      })

      reply.status(201).send()
    },
  )

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createParamsSchema = z.object({ id: z.string().uuid() })

      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isOnDiet: z.boolean(),
        date: z.coerce.date(),
      })

      const { id } = createParamsSchema.parse(request.params)

      const meal = await knex('meals')
        .where({
          id,
          user_id: request.user?.id,
        })
        .first()

      if (!meal) {
        return reply.status(404).send({ message: 'This meal does not exists' })
      }

      const { name, description, isOnDiet, date } = createMealBodySchema.parse(
        request.body,
      )

      await knex('meals').where({ id }).update({
        name,
        description,
        is_on_diet: isOnDiet,
        date: date.getTime(),
        updated_at: knex.fn.now(),
      })

      return reply.status(204).send()
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createParamsSchema = z.object({ id: z.string().uuid() })

      const { id } = createParamsSchema.parse(request.params)

      await knex('meals')
        .where({
          id,
          user_id: request.user?.id,
        })
        .delete()

      reply.status(204).send()
    },
  )
}

import addFormats from 'ajv-formats'
import { default as Ajv2020, type AnySchema } from 'ajv/dist/2020.js'
import type { Middleware } from 'koa'
import { ValidationError } from '../utils/errors.js'

const ajv = new Ajv2020.default({ allErrors: true, strictNumbers: true })
addFormats.default(ajv)

/**
 * This middleware generator accepts json-schema and returns Middleware
 * It checks that request body matches the given schema,
 * and responds with 400, and validation errors if schema is not satisfied
 * The response data detail contains raw validation errors that ajv provides
 * maybe TODO: return nicer (more human-readable) validation errors
 */
export const validateBody =
  (schema: AnySchema): Middleware =>
  async (ctx, next) => {
    const validate = ajv.compile(schema)
    const isValid = validate(ctx.request.body)

    if (isValid) return await next()
    else throw new ValidationError('Invalid data', validate.errors ?? [])
  }

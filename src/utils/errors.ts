import { ErrorObject } from 'ajv/dist/2020.js'
import { Middleware } from 'koa'

export class HttpError extends Error {
  public status: number
  public response: Response

  constructor(message: string, response: Response) {
    super(message)
    this.name = 'HttpError'
    this.status = response.status
    this.response = response

    // Set the prototype explicitly to maintain correct instance type
    Object.setPrototypeOf(this, HttpError.prototype)
  }
}

export class ValidationError extends Error {
  public errors: ErrorObject | unknown[]

  constructor(message: string, errors: ErrorObject | unknown[]) {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors

    // Set the prototype explicitly to maintain correct instance type
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'

    // Set the prototype explicitly to maintain correct instance type
    Object.setPrototypeOf(this, ConfigError.prototype)
  }
}

export const handleErrors: Middleware = async (ctx, next) => {
  try {
    await next()
  } catch (e) {
    if (e instanceof ValidationError) {
      ctx.response.status = 400
      ctx.response.type = 'json'
      ctx.response.body = {
        message: e.message,
        detail: e.errors,
      }
    } else throw e
  }
}

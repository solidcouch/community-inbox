import { bodyParser } from '@koa/bodyparser'
import cors from '@koa/cors'
import Router from '@koa/router'
import { solidIdentity } from '@soid/koa'
import Koa from 'koa'
import helmet from 'koa-helmet'
import serve from 'koa-static'
import { processRequest, verifyRequest } from './controllers/inbox.js'
import { loadConfig } from './middlewares/loadConfig.js'
import { solidAuth } from './middlewares/solidAuth.js'
import { validateBody } from './middlewares/validate.js'
import * as schema from './schema.js'
import { handleErrors } from './utils/errors.js'

export interface AppConfig {
  readonly webId: string
  readonly isBehindProxy?: boolean
  readonly groupToJoin: string
  readonly groupsToLeave: string[]
  readonly community?: string
}

const createApp = async (config: AppConfig) => {
  const identity = solidIdentity(config.webId)

  const app = new Koa()
  app.proxy = Boolean(config.isBehindProxy)
  const router = new Router<{ config: AppConfig } & { user: string }>()

  router.use(identity.routes()).post(
    '/inbox',
    solidAuth,
    /* #swagger.requestBody = {
        required: true,
        content: {
          'application/ld+json': {
            schema: {
              $ref: '#/components/schemas/notification',
            },
          },
        },
      }
      */
    validateBody(schema.notification),
    verifyRequest,
    processRequest,
  )

  app
    .use(helmet.default())
    .use(cors({ exposeHeaders: ['location'] }))
    .use(
      bodyParser({
        enableTypes: ['text', 'json'],
        extendTypes: {
          json: ['application/ld+json', 'application/json'],
          text: ['text/turtle'],
        },
        encoding: 'utf-8',
      }),
    )
    .use(handleErrors)
    .use(loadConfig(config))
    .use(serve('./apidocs'))
    .use(router.routes())
    .use(router.allowedMethods())

  return app
}

export { createApp }

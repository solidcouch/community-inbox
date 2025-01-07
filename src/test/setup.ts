import * as css from '@solid/community-server'
import { IncomingMessage, Server, ServerResponse } from 'http'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { foaf, vcard } from 'rdf-namespaces'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { createApp } from '../app.js'
import { createRandomAccount, getRandomPort } from './helpers/index.js'
import { createResource } from './helpers/setupPod.js'
import type { Person } from './helpers/types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface TestContext {
  css: { port: number; origin: string }
  app: { port: number; origin: string; webId: string }
  people: [Person, Person, Person]
  community: { person: Person; community: string; group: string }
}

let cssServer: css.App
let cssPort: number

beforeAll(async () => {
  cssPort = getRandomPort()

  const start = Date.now()

  // eslint-disable-next-line no-console
  console.log('Starting CSS server')
  // Community Solid Server (CSS) set up following example in https://github.com/CommunitySolidServer/hello-world-component/blob/main/test/integration/Server.test.ts
  cssServer = await new css.AppRunner().create({
    loaderProperties: {
      mainModulePath: css.joinFilePath(__dirname, '../../'), // ?
      typeChecking: false, // ?
      dumpErrorState: false, // disable CSS error dump
    },
    variableBindings: {},
    // CSS cli options
    // https://github.com/CommunitySolidServer/CommunitySolidServer/tree/main#-parameters
    shorthand: {
      port: cssPort,
      loggingLevel: 'off',
    },
  })
  await cssServer.start()

  // eslint-disable-next-line no-console
  console.log(
    'CSS server started on port',
    cssPort,
    'in',
    (Date.now() - start) / 1000,
    'seconds',
  )
}, 60000)

afterAll(async () => {
  await cssServer.stop()
})

// save css variables into test context
beforeEach<TestContext>(ctx => {
  ctx.css = {
    port: cssPort,
    get origin() {
      return `http://localhost:${this.port}`
    },
  }
})

/**
 * Before each test, create a few persons and community
 */
beforeEach<TestContext>(async ctx => {
  ctx.people = [
    await createRandomAccount({ solidServer: ctx.css.origin }),
    await createRandomAccount({ solidServer: ctx.css.origin }),
    await createRandomAccount({ solidServer: ctx.css.origin }),
  ]
  ctx.community = {
    person: await createRandomAccount({ solidServer: ctx.css.origin }),
    get community() {
      return new URL('community#us', this.person.podUrl).toString()
    },
    get group() {
      return new URL('group#us', this.person.podUrl).toString()
    },
  }
}, 20000)

let server: Server<typeof IncomingMessage, typeof ServerResponse>
beforeEach<TestContext>(async ctx => {
  ctx.app = {
    port: getRandomPort(),
    get origin() {
      return `http://localhost:${this.port}`
    },
    get webId() {
      return new URL('/profile/card#bot', this.origin).toString()
    },
  }

  const app = await createApp({
    webId: ctx.app.webId,
    groupToJoin: ctx.community.group,
  })

  server = await new Promise(resolve => {
    const srv = app.listen(ctx.app.port, () => {
      resolve(srv)
    })
  })
})

afterEach(async () => {
  await new Promise(resolve => server.close(resolve))
})

beforeEach<TestContext>(async ctx => {
  // create the community
  await createResource({
    url: ctx.community.group,
    body: `<${new URL(ctx.community.group).hash}> a <${vcard.Group}>; <${vcard.hasMember}> <${ctx.people[2].webId}>.`,
    acls: [
      {
        permissions: ['Read', 'Write', 'Append', 'Control'],
        agents: [ctx.community.person.webId],
      },
      { permissions: ['Read'], agentClasses: [foaf.Agent] },
      { permissions: ['Read', 'Write'], agents: [ctx.app.webId] },
    ],
    authenticatedFetch: ctx.community.person.fetch,
  })
})

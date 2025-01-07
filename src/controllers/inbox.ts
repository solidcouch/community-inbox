import { getAuthenticatedFetch } from '@soid/koa'
import { type Middleware } from 'koa'
import assert from 'node:assert'
import { solid, vcard } from 'rdf-namespaces'
import { AppConfig } from '../app.js'
import { HttpError, ValidationError } from '../utils/errors.js'

export const verifyReqest: Middleware<{
  user: string
  config: AppConfig
}> = async (ctx, next) => {
  const actor = ctx.request.body.actor.id
  const authenticatedUser = ctx.state.user
  const object = ctx.request.body.object.id
  const group = ctx.state.config.groupToJoin

  if (actor !== authenticatedUser)
    ctx.throw(
      403,
      `Actor does not match authenticated agent.\nActor: ${actor}\nAuthenticated agent: ${authenticatedUser}`,
    )

  if (object !== group)
    throw new ValidationError(
      `Object does not match expected group.\nExpected: ${group}\nActual: ${object}`,
      [],
    )

  await next()
}

export const processRequest: Middleware<{
  user: string
  config: AppConfig
}> = async ctx => {
  const group = ctx.state.config.groupToJoin
  const authFetch = await getAuthenticatedFetch(ctx.state.config.webId)
  const response = await authFetch(group, {
    headers: { 'content-type': 'text/n3' },
    method: 'PATCH',
    body: `_:add a <${solid.InsertDeletePatch}>;
        <${solid.inserts}> { <${group}> <${vcard.hasMember}> <${ctx.state.user}> . }.
      `,
  })

  if (!response.ok)
    throw new HttpError(
      `Adding person ${ctx.state.user} to group ${group} failed.`,
      response,
    )

  assert(response.ok)

  ctx.status = 200
  ctx.set('location', group)
}

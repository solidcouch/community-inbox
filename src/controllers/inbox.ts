import { getAuthenticatedFetch } from '@soid/koa'
import { type Middleware } from 'koa'
import { solid, vcard } from 'rdf-namespaces'
import { AppConfig } from '../app.js'
import { HttpError, ValidationError } from '../utils/errors.js'

export const verifyRequest: Middleware<{
  user: string
  config: AppConfig
}> = async (ctx, next) => {
  const actor = ctx.request.body.actor.id
  const authenticatedUser = ctx.state.user
  const object = ctx.request.body.object.id
  const { groupToJoin, groupsToLeave } = ctx.state.config
  const task: 'Join' | 'Leave' = ctx.request.body.type

  if (actor !== authenticatedUser)
    ctx.throw(
      403,
      `Actor does not match authenticated agent.\nActor: ${actor}\nAuthenticated agent: ${authenticatedUser}`,
    )

  switch (task) {
    case 'Join': {
      if (object !== groupToJoin)
        throw new ValidationError(
          `Object does not match expected group.\nExpected: ${groupToJoin}\nActual: ${object}`,
          [],
        )
      break
    }
    case 'Leave': {
      if (!groupsToLeave.includes(object))
        throw new ValidationError(
          `Object does not match any of the expected groups.\nExpected: ${groupsToLeave.join(',')}\nActual: ${object}`,
          [],
        )
      break
    }
    default: {
      throw new Error(`Unrecognized task: ${task}`)
    }
  }

  await next()
}

export const processRequest: Middleware<{
  user: string
  config: AppConfig
}> = async (ctx, next) => {
  const task: 'Join' | 'Leave' = ctx.request.body.type

  switch (task) {
    case 'Join': {
      return await joinGroup(ctx, next)
    }
    case 'Leave': {
      return await leaveGroup(ctx, next)
    }
    default:
      throw new Error('Unexpected task')
  }
}

const joinGroup: Middleware<{
  user: string
  config: AppConfig
}> = async ctx => {
  const group = ctx.request.body.object.id

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
      500,
    )

  ctx.status = 200
  ctx.set('location', group)
}

const leaveGroup: Middleware<{
  user: string
  config: AppConfig
}> = async ctx => {
  const group = ctx.request.body.object.id

  const authFetch = await getAuthenticatedFetch(ctx.state.config.webId)
  const response = await authFetch(group, {
    headers: { 'content-type': 'text/n3' },
    method: 'PATCH',
    body: `_:remove a <${solid.InsertDeletePatch}>;
        <${solid.deletes}> { <${group}> <${vcard.hasMember}> <${ctx.state.user}> . }.
      `,
  })

  if (!response.ok)
    throw new HttpError(
      `Removing person ${ctx.state.user} from group ${group} failed.`,
      response,
      response.status === 409 ? 409 : 500,
    )

  ctx.status = 200
}

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
  const { groupToJoin, groupsToLeave, community } = ctx.state.config
  const task: 'Join' | 'Leave' = ctx.request.body.type

  if (actor !== authenticatedUser)
    ctx.throw(
      403,
      `Actor does not match authenticated agent.\nActor: ${actor}\nAuthenticated agent: ${authenticatedUser}`,
    )

  switch (task) {
    case 'Join': {
      const allowedObjects = [groupToJoin]
      if (community) allowedObjects.push(community)

      if (!allowedObjects.includes(object))
        throw new ValidationError(
          `Object does not match expected group or community.\nExpected: ${allowedObjects.join(',')}\nActual: ${object}`,
          [],
        )
      break
    }
    case 'Leave': {
      const allowedObjects = [...groupsToLeave]
      if (community) allowedObjects.push(community)
      if (!allowedObjects.includes(object))
        throw new ValidationError(
          `Object does not match any of the expected groups or community.\nExpected: ${allowedObjects.join(',')}\nActual: ${object}`,
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
      500,
    )

  ctx.status = 200
  ctx.set('location', group)
}

const leaveGroup: Middleware<{
  user: string
  config: AppConfig
}> = async ctx => {
  const groupsToLeave: string[] = []

  // if object is a community, try removing person from all configured groups
  if (ctx.request.body.object.id === ctx.state.config.community)
    groupsToLeave.push(...ctx.state.config.groupsToLeave)
  // other remove person from the specified group only
  else groupsToLeave.push(ctx.request.body.object.id)

  // attempt all defined removals
  const settledResults = await Promise.allSettled(
    groupsToLeave.map(async (group: string) => {
      const authFetch = await getAuthenticatedFetch(ctx.state.config.webId)
      return await authFetch(group, {
        headers: { 'content-type': 'text/n3' },
        method: 'PATCH',
        body: `_:remove a <${solid.InsertDeletePatch}>;
        <${solid.deletes}> { <${group}> <${vcard.hasMember}> <${ctx.state.user}> . }.
      `,
      })
    }),
  )

  // process results
  const results = settledResults.reduce<{
    // successful removals
    success: { group: string; response: Response }[]
    // http error responses
    httpError: { group: string; response: Response }[]
    // thrown errors
    error: { group: string; error: unknown }[]
  }>(
    (results, result, i) => {
      const group = groupsToLeave[i]
      // this shouldn't happen, but skip just in case
      if (!group) return results

      if (result.status === 'rejected') {
        results.error.push({ group, error: result.reason })
      } else if (result.value.ok) {
        results.success.push({ group, response: result.value })
      } else results.httpError.push({ group, response: result.value })

      return results
    },
    { success: [], httpError: [], error: [] },
  )

  ctx.body = {
    successes: results.success.map(r => r.group),
    conflicts: results.httpError
      .filter(r => r.response.status === 409)
      .map(r => r.group),
    errors: [
      ...results.httpError
        .filter(r => r.response.status !== 409)
        .map(r => r.group),
      ...results.error.map(r => r.group),
    ],
  }

  // if some requests succeeded, return success
  if (results.success.length > 0) ctx.status = 200
  // if there is some unexpected failure, return internal server error
  else if (
    results.error.length > 0 ||
    results.httpError.some(result => result.response.status !== 409)
  )
    ctx.status = 500
  // if all errors are 409 Conflict, return 409 Conflict
  // this is typically a result of trying to remove missing triple(s)
  // https://solidproject.org/TR/protocol#server-patch-n3-semantics-deletions-non-empty-all-triples
  else if (
    results.httpError.length > 0 &&
    results.httpError.every(result => result.response.status === 409)
  )
    ctx.status = 409
  // and nothing else should be left over
  else throw new Error('Unexpected error: unexpected condition')
}

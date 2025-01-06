import { getAuthenticatedFetch } from '@soid/koa'
import { type Middleware } from 'koa'
import assert from 'node:assert'
import { solid, vcard } from 'rdf-namespaces'
import { AppConfig } from '../app.js'
import { HttpError } from '../utils/errors.js'

export const addPersonToGroup =
  (group: string): Middleware<{ user: string; config: AppConfig }> =>
  async ctx => {
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
  }

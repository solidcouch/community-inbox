import { Parser, Store } from 'n3'
import { vcard } from 'rdf-namespaces'
import { describe, expect, test } from 'vitest'
import { type TestContext } from './setup.js'

describe('Joining the community', () => {
  test.todo('[request is not authenticated] 401')
  test.todo('[actor is missing] 400')
  test.todo('[object is missing] 400')
  test.todo('[actor does not match authenticated user] 403')
  test.todo('[object does not match the community] 400')
  test.todo('[actor is already a member] 409')

  test<TestContext>('[all ok] 200 should add the actor to the appropriate group, and include Location header to that group', async ctx => {
    const person = ctx.people[0]

    // send request to the app
    const response = await person.fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Join',
        actor: { type: 'Person', id: person.webId },
        object: {
          type: 'Community',
          id: 'https://example.com',
        },
      }),
    })

    // receive response 200
    expect(response.status).toBe(200)

    // check that the person is in the group now
    const groupResponse = await fetch(ctx.community.group)
    expect(groupResponse.ok).toEqual(true)
    const groupRaw = await groupResponse.text()
    const quads = new Parser({ baseIRI: ctx.community.group }).parse(groupRaw)
    const store = new Store(quads)
    const found = store.getQuads(
      ctx.community.group,
      vcard.hasMember,
      person.webId,
      null,
    )
    expect(found).toHaveLength(1)
  })
})

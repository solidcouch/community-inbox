import { describe, expect, test } from 'vitest'
import { checkMembership } from './helpers/index.js'
import { type TestContext } from './setup.js'

describe('Joining the community', () => {
  test<TestContext>('[request is not authenticated] 401', async ctx => {
    const person = ctx.people[0]

    // send unauthenticated request to the app
    const response = await fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Join',
        actor: { type: 'Person', id: person.webId },
        object: { type: 'Group', id: ctx.community.group },
      }),
    })

    // receive response 401
    expect(response.status).toBe(401)

    // check that the person is not in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(false)
  })

  test<TestContext>('[actor is missing] 400', async ctx => {
    const person = ctx.people[0]

    // send unauthenticated request to the app
    const response = await person.fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Join',
        object: { type: 'Group', id: ctx.community.group },
      }),
    })
    // receive response 400
    expect(response.status).toBe(400)
    // check that the person is not in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(false)
  })

  test<TestContext>('[object is missing] 400', async ctx => {
    const person = ctx.people[0]

    // send unauthenticated request to the app
    const response = await person.fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Join',
        actor: { type: 'Person', id: person.webId },
      }),
    })
    // receive response 400
    expect(response.status).toBe(400)
    // check that the person is not in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(false)
  })

  test<TestContext>('[actor does not match authenticated user] 403', async ctx => {
    const [person1, person2] = ctx.people

    // send unauthenticated request to the app
    const response = await person1.fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Join',
        actor: { type: 'Person', id: person2.webId },
        object: { type: 'Group', id: ctx.community.group },
      }),
    })
    // receive response 403
    expect(response.status).toBe(403)
    // check that the person is not in the group
    expect(await checkMembership(person1.webId, ctx.community.group)).toBe(
      false,
    )
    expect(await checkMembership(person2.webId, ctx.community.group)).toBe(
      false,
    )
  })

  test<TestContext>('[object does not match the group] 400', async ctx => {
    const person = ctx.people[0]

    // check that the person is not in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(false)

    // send request to the app
    const response = await person.fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Join',
        actor: { type: 'Person', id: person.webId },
        object: { type: 'Group', id: 'https://example.com/community/group#us' },
      }),
    })

    // receive response 400
    expect(response.status).toBe(400)

    // check that the person is in the group now
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(false)
  })

  test<TestContext>('[actor is already a member] 200', async ctx => {
    const person = ctx.people[2]

    // check that the person is in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(true)

    // send request to the app
    const response = await person.fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Join',
        actor: { type: 'Person', id: person.webId },
        object: { type: 'Group', id: ctx.community.group },
      }),
    })

    // don't sweat it
    expect(response.status).toBe(200)

    // check that the person is still in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(true)
  })

  test<TestContext>('[all ok] 200 should add the actor to the appropriate group, and include Location header to that group', async ctx => {
    const person = ctx.people[0]

    // check that the person is not in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(false)

    // send request to the app
    const response = await person.fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Join',
        actor: { type: 'Person', id: person.webId },
        object: { type: 'Group', id: ctx.community.group },
      }),
    })

    // receive response 200
    expect(response.status).toBe(200)

    // check that the person is in the group now
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(true)

    // check that a Location header is present
    expect(response.headers.get('location')).toBe(ctx.community.group)
  })

  test<TestContext>('[community instead of group] 200 should add the actor to the predefined group', async ctx => {
    const person = ctx.people[0]

    // check that the person is not in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(false)

    // send request to the app
    const response = await person.fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Join',
        actor: { type: 'Person', id: person.webId },
        object: { type: 'Group', id: ctx.community.community },
      }),
    })

    // receive response 200
    expect(response.status).toBe(200)

    // check that the person is in the group now
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(true)

    // check that a Location header is present
    expect(response.headers.get('location')).toBe(ctx.community.group)
  })
})

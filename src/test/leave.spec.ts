import { describe, expect, test } from 'vitest'
import { checkMembership } from './helpers/index.js'
import { TestContext } from './setup.js'

describe('Leaving the community', () => {
  test<TestContext>('[request is not authenticated] 401', async ctx => {
    const person = ctx.people[2]

    // check that the person is in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(true)

    // send request to the app
    const response = await fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Leave',
        actor: { type: 'Person', id: person.webId },
        object: { type: 'Group', id: ctx.community.group },
      }),
    })

    // receive response 401
    expect(response.status).toBe(401)

    // check that the person is still in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(true)
  })

  test<TestContext>('[actor is missing] 400', async ctx => {
    const person = ctx.people[2]

    // check that the person is in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(true)

    // send request to the app
    const response = await person.fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Leave',
        object: { type: 'Group', id: ctx.community.group },
      }),
    })

    // receive response 400
    expect(response.status).toBe(400)

    // check that the person is still in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(true)
  })

  test<TestContext>('[object is missing] 400', async ctx => {
    const person = ctx.people[2]

    // check that the person is in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(true)

    // send request to the app
    const response = await person.fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Leave',
        actor: { type: 'Person', id: person.webId },
      }),
    })

    // receive response 400
    expect(response.status).toBe(400)

    // check that the person is still in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(true)
  })

  test<TestContext>('[actor does not match authenticated user] 403', async ctx => {
    const [, person2, person3] = ctx.people

    // check that the person is in the group
    expect(await checkMembership(person3.webId, ctx.community.group)).toBe(true)

    // send request to the app
    const response = await person2.fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Leave',
        actor: { type: 'Person', id: person3.webId },
        object: { type: 'Group', id: ctx.community.group },
      }),
    })

    // receive response 403
    expect(response.status).toBe(403)

    // check that the person is still in the group
    expect(await checkMembership(person3.webId, ctx.community.group)).toBe(true)
  })

  test<TestContext>('[object does not match any configured groups] 400', async ctx => {
    const person = ctx.people[2]

    // check that the person is in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(true)

    // send request to the app
    const response = await person.fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Leave',
        actor: { type: 'Person', id: person.webId },
        object: { type: 'Group', id: 'https://example.com/community/group#us' },
      }),
    })

    // receive response 400
    expect(response.status).toBe(400)

    // check that the person is still in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(true)
  })

  test<TestContext>('[actor is not in the group] 409', async ctx => {
    const person = ctx.people[0]

    // check that the person is not in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(false)

    // send request to the app
    const response = await person.fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Leave',
        actor: { type: 'Person', id: person.webId },
        object: { type: 'Group', id: ctx.community.group },
      }),
    })

    // receive response 409
    expect(response.status).toBe(409)

    // check that the person is not in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(false)
  })

  test<TestContext>("[all ok] should remove the actor from community's groups", async ctx => {
    const person = ctx.people[2]

    // check that the person is in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(true)

    // send request to the app
    const response = await person.fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Leave',
        actor: { type: 'Person', id: person.webId },
        object: { type: 'Group', id: ctx.community.group },
      }),
    })

    // receive response 200
    expect(response.status).toBe(200)

    // check that the person is not in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(false)
  })

  test<TestContext>("[object is community] should remove the actor from all predefined community's groups", async ctx => {
    const person = ctx.people[2]

    // check that the person is in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(true)

    // send request to the app
    const response = await person.fetch(`${ctx.app.origin}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Leave',
        actor: { type: 'Person', id: person.webId },
        object: { type: 'Group', id: ctx.community.community },
      }),
    })

    // receive response 200
    expect(response.status).toBe(200)

    // check that the person is not in the group
    expect(await checkMembership(person.webId, ctx.community.group)).toBe(false)
  })
})

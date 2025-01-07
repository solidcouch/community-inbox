import { parseLinkHeader } from '@solid/community-server'
import { createAccount, getAuthenticatedFetch } from 'css-authn/dist/7.x.js'
import { Parser, Store } from 'n3'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { vcard } from 'rdf-namespaces'
import { expect } from 'vitest'

export const createRandomAccount = async ({
  solidServer,
}: {
  solidServer: string
}) => {
  const account = await createAccount({
    username: randomUUID(),
    password: randomUUID(),
    email: randomUUID() + '@example.com',
    provider: solidServer,
  })

  const authenticatedFetch = await getAuthenticatedFetch({
    email: account.email,
    password: account.password,
    provider: solidServer,
  })

  return { ...account, fetch: authenticatedFetch }
}

/**
 * Find link to ACL document for a given URI
 */
export const getAcl = async (
  uri: string,
  ffetch: typeof globalThis.fetch = globalThis.fetch,
) => {
  const response = await ffetch(uri, { method: 'HEAD' })
  expect(response.ok).toBe(true)
  const linkHeader = response.headers.get('link')
  const links = parseLinkHeader(linkHeader ?? '')
  const aclLink = links.find(link => link.parameters.rel === 'acl')
  const aclUri = aclLink?.target

  assert(aclUri)

  // if (!aclUri) throw new Error(`We could not find WAC link for ${uri}`)
  // if aclUri is relative, return absolute uri
  return new URL(aclUri, uri).toString()
}

// export const getContainer = (uri: string) =>
//   uri.substring(0, uri.lastIndexOf('/') + 1)

export const getResource = (uri: string) => {
  const url = new URL(uri)
  const clearedUrl = new URL(url.pathname, url.origin).toString()
  return clearedUrl
}

export function getRandomPort(): number {
  // Generate a random number between 1024 and 65535
  const min = 1024
  const max = 65535
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const checkMembership = async (
  person: string,
  group: string,
  fetch: typeof globalThis.fetch = globalThis.fetch,
) => {
  // check that the person is in the group now
  const groupResponse = await fetch(group)
  expect(groupResponse.ok).toEqual(true)
  const groupRaw = await groupResponse.text()
  const quads = new Parser({ baseIRI: group }).parse(groupRaw)
  const store = new Store(quads)
  const found = store.getQuads(group, vcard.hasMember, person, null)

  switch (found.length) {
    case 0:
      return false
    case 1:
      return true
    default:
      throw new Error('Member should be found maximum once.')
  }
}

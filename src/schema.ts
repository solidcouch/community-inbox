import { JSONSchemaType } from 'ajv/dist/2020.js'

export const notification: JSONSchemaType<{
  type: 'Join'
  id: string
  '@context': 'https://www.w3.org/ns/activitystreams'
  actor: { type: 'Person'; id: string }
  object: {
    type: 'Community'
    id: string
  }
}> = {
  type: 'object',
  properties: {
    '@context': {
      type: 'string',
      const: 'https://www.w3.org/ns/activitystreams',
    },
    id: { type: 'string' },
    type: { type: 'string', enum: ['Join'] },
    actor: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'Person' },
        id: { type: 'string', format: 'uri' },
      },
      required: ['type', 'id'],
    },
    object: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['Community'] },
        id: { type: 'string', format: 'uri' },
      },
      required: ['type', 'id'],
    },
  },
  required: ['@context', 'type', 'actor', 'object'],
  additionalProperties: false,
}

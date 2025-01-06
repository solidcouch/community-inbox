import { describe, test } from 'vitest'

describe('Leaving the community', () => {
  test.todo('[request is not authenticated] 401')
  test.todo('[actor is missing] 400')
  test.todo('[object is missing] 400')
  test.todo('[actor does not match authenticated user] 403')
  test.todo('[object does not match the community] 400')
  test.todo("[actor is not in any community's group] 404")
  test.todo("[all ok] should remove the actor from community's groups")
})

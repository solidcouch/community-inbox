/* eslint-disable no-console */
import { createApp } from './app.js'
import {
  community,
  groupsToLeave,
  groupToJoin,
  isBehindProxy,
  port,
  webId,
} from './config/index.js'

createApp({ webId, isBehindProxy, groupToJoin, groupsToLeave, community }).then(
  app =>
    app.listen(port, async () => {
      console.log(`community inbox service is listening on port ${port}`)
    }),
)

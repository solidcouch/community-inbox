/* eslint-disable no-console */
import { createApp } from './app.js'
import { groupToJoin, isBehindProxy, port, webId } from './config/index.js'

createApp({ webId, isBehindProxy, groupToJoin }).then(app =>
  app.listen(port, async () => {
    console.log(`community inbox service is listening on port ${port}`)
  }),
)

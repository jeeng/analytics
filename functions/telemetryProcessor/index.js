import Redis from '../../redis'
import Queries from './queries'
import { errorBuilder, decodeId } from '../../utils'
import moment from 'moment'

const redis = new Redis()

export default function (event, context, callback) {
  const errorHandler = (at, err) => {
    console.log(errorBuilder({ at, err }));
    Promise.all([
      redis.closeClient(),
      Queries.closeClient(),
    ]).then(() => callback(null, 'Ended with error'))
      .catch(err2 =>
        callback(null,
          `Error closing down connections:${JSON.stringify(err2)}`
        )
      )
  }
    
  const nextTimestamp = Queries.getNextTimestamp()

  return Promise.all([
    activeWidgets,
    nextTimestamp
  ]).then(([widgetIds, nextTimestamp]) =>
    redis.mget(widgetIds.map(widgetId =>
      `WidgetSeen::${nextTimestamp}::${widgetId}`))
    )
    .then(keyValuePairs => keyValuePairs.map(({ key, value }) => {
      const [ts, widgetId] = key.split('::').slice(1)
      return {
        ts,
        widgetId: decodeId(widgetId),
        count: parseInt(value) || 0
      }
    }))
    .then(Queries.insertWidgetSeens)
    .then(() => Promise.all([
      redis.closeClient(),
      Queries.closeClient(),
    ]))
    .then(() => callback(null, 'execution finished.'))
    .catch(err => errorHandler('widgetSeenProcessor', err))
}
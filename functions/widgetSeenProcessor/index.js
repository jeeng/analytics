import Redis from '../../redis'
import Queries from './queries'
import { errorBuilder } from '../../utils'

const redis = new Redis()

export default function (event, context, callback) {
  const errorHandler = (at, err, callback) => {
    console.log(errorBuilder({ at, err }));
    callback(null, 'Ended with error')
  }

  const activeWidgets = Queries.getActiveWidgets()
  const missingTimestamps = Queries.getMissingTimestamps()

  Promise.all([
    activeWidgets,
    missingTimestamps
  ]).then(([widgetIds, missingTimestamps]) => {
    const fromRedis = widgetIds.map(widgetId => {
      return missingTimestamps.map(timestamp => {
        const key = `WidgetSeen:${timestamp}:${widgetId}`
        return redis.getClient()
          .then(client => client.hgetall(key))
          .then(data => ({ widgetId, timestamp, data }))
      })
    })

    return Promise.all(fromRedis)
      .catch(err => errorHandler('fromRedisPromises', err))
      .then(Queries.insertWidgetSeens)
      .catch(err => errorHandler('WidgetSeenInsertion', err))
  }).catch(err => errorHandler('widgetSeenProcessor', err))


}
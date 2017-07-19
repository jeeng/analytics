import Redis from '../../redis'
import Queries from './queries'
import { errorBuilder } from '../../utils'
import moment from 'moment'

const redis = new Redis()

export default function (event, context, callback) {
  const errorHandler = (at, err) => {
    console.log(errorBuilder({ at, err }));
    callback(null, 'Ended with error')
  }

  const activeWidgets = Queries.getActiveWidgets()
  const nextTimestamp = Queries.getNextTimestamp()

  return Promise.all([
    activeWidgets,
    nextTimestamp
  ]).then(([widgetIds, nextTimestamp]) => {
    const keys = widgetIds
      .map(widgetId => `WidgetSeen:${nextTimestamp}:${widgetId}`)

    return redis.mget(keys)
      .then(x => { console.log('processed results:', x); return x })
  }).catch(err => errorHandler('widgetSeenProcessor', err))


  // const fromRedisChain = fromRedis.reduce((a, b) => a.then(aRes => {
  //   return b.then(bRes => [...aRes, bRes])
  // }), Promise.resolve([]))

  // return fromRedisChain
  //   // .catch(err => errorHandler('fromRedisPromises', err))
  //   .then(x => { console.log(x); return x })
  //   .then(Queries.insertWidgetSeens)
  //   .catch(err => errorHandler('WidgetSeenInsertion', err))
  //   .then(() => Promise.all([
  //     redis.closeClient(),
  //     Queries.closeClient()
  //   ]))
  //   .then(() => callback(null, 'execution finished!'))
}
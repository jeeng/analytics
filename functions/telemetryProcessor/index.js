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

  return Queries.getNextTimestamp()
    .then(nextTimestamp =>
      redis.lrange(`Telemetries::${nextTimestamp}`, 0, -1))
    .then(Queries.insertTelemetries)
    .then(() => Promise.all([
      redis.closeClient(),
      Queries.closeClient(),
    ]))
    .then(() => callback(null, 'execution finished.'))
    .catch(err => errorHandler('telemetryProcessor', err))
}
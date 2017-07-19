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

  const endExecution = () => Promise.all([
    redis.closeClient(),
    Queries.closeClient(),
  ]).then(() => callback(null, 'execution finished.'))

  const initData = Queries.getInitData()
    .then(x => { console.log(x); return x })
  const telemetryStrings = initData
    .then(({ next_ts }) => {
      console.log('next_ts', next_ts);

      return !!next_ts ?
        redis.lrange(`Telemetries::${next_ts}`, 0, -1) :
        Promise.reject('FUTURE_TS')
    }
    )

  return Promise.all([
    initData,
    telemetryStrings
  ]).then(([
    { next_ts, telemetry_types, notification_types },
    telemetryStrings
  ]) => {
    const telemetries = telemetryStrings.map(telemetryString => {
      try {
        const telemetry = JSON.parse(telemetryString)
        telemetry.telemetry_type_id =
          telemetry_types[telemetry.telemetry_type]
        telemetry.notification_type_id =
          telemetry_types[telemetry.notification_type]
        return telemetry
      } catch (e) {
        return null
      }
    }).filter(telemetry => {
      return !!telemetry && !!telemetry.telemetry_type_id
    })

    return { telemetries, nextTimestamp: next_ts }
  })
    .then(Queries.insertTelemetries)
    .then(endExecution)
    .catch(err => {
      // if (err = 'FUTURE_TS')
      //   return endExecution()
      errorHandler('telemetryProcessor', err)
    })
}
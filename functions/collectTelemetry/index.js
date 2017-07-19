import Joi from 'joi'
import Redis from '../../redis'
import Schemas from './validationSchemas';
import moment from 'moment';
import { errorBuilder } from '../../utils'

const keyExpireTime = 3600 * 24 * 3

const redis = new Redis()

export default function (event, context, callback) {
  const body = JSON.parse(event.body)
  const { error } = Joi.validate(body, Schemas.request.body)
  if (!!error)
    return errorHandler(error, callback)

  const {
    notification_type,
    telemetry_type,
    session_id,
    widget_id,
    jeeng_id,
    user_id,
    cta_id } = body;

  const coeff = 1000 * 3600
  const createdAtTs = Date.now()
  const created_at = moment(createdAtTs).format('YYYY-MM-DD HH:mm:ss')
  const hour = moment(Math.ceil(createdAtTs / coeff) * coeff)
    .format('YYYY-MM-DD HH:mm:ss')

  redis.getClient()
    .then(client => {
      let query = null

      switch (telemetry_type) {
        case 'WidgetSeen': {
          const key = `WidgetSeen::${hour}::${widget_id}`
          query = client.multi()
            .incr(key)
            .expire(key, keyExpireTime)
        }
        default: {
          const key = `Telemetries::${hour}`
          const telemetry = JSON.stringify({
            notification_type,
            telemetry_type,
            created_at,
            session_id,
            widget_id,
            jeeng_id,
            user_id,
            cta_id,
          })

          query = client.multi()
            .rpush(key, JSON.stringify(telemetry))
            .expire(key, keyExpireTime)
        }
      }

      return query.exec((err, replies) => {
        return !!err ?
          errorHandler(err, callback, client) :
          okReply(callback, client)
      })
    }).catch(err => callback(null, {
      statusCode: 200,
      body: JSON.stringify(err)
    }))
}


const errorHandler = (err, callback, client) => {
  if (!!client)
    client.quit()
  console.log(JSON.stringify(errorBuilder({
    at: 'collectTelemetry:inputValidation',
    err
  })))
  callback(null, {
    statusCode: 500,
    body: JSON.stringify({ error: 'Server error.' })
  })
}

const okReply = (callback, client) => {
  if (!!client)
    client.quit()
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({ status: 'OK' })
  })
}

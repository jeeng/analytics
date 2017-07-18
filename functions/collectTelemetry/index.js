import Joi from 'joi'
import Redis from '../../redis'
import Schemas from './validationSchemas';
import moment from 'moment';

const keyExpireTime = 3600 * 24 * 3

const redis = new Redis()

export default function (event, context, callback) {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

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
  const hour = moment(Math.floor(Date.now() / coeff) * coeff)
    .format('YYYY-MM-DD HH:mm:ss')

  const telemetry = JSON.stringify({
    notification_type,
    telemetry_type,
    session_id,
    widget_id,
    jeeng_id,
    user_id,
    cta_id,
  })

  redis.getClient()
    .then(client => {
      switch (telemetry_type) {
        case 'WidgetSeen': {
          const key = `WidgetSeen:${hour}:${widget_id}`
          return client.multi()
            .hincrby(key, cta_id, 1)
            .expire(key, keyExpireTime)
            .exec((err, replies) => !!err ?
              errorHandler(err, callback) :
              okReply(callback)
            )
        }
        default: {
          const key = `Telemetry:${hour}`
          const telemetry = JSON.stringify({
            notification_type,
            telemetry_type,
            session_id,
            widget_id,
            jeeng_id,
            user_id,
            cta_id,
          })

          return client.multi()
            .set(key, JSON.stringify(telemetry))
            .expire(key, keyExpireTime)
            .exec((err, replies) => !!err ?
              errorHandler(err, callback) :
              okReply(callback)
            )
        }
      }
    }).catch(err => callback(null, {
      statusCode: 200,
      body: JSON.stringify(err)
    }))
}


const errorHandler = (err, callback) => {
  console.log(JSON.stringify({
    at: 'collectTelemetry:inputValidation',
    err
  }))
  callback(null, {
    statusCode: 500,
    body: JSON.stringify({ error: 'Input Error has occured.' })
  })
}

const okReply = callback => callback(null, {
  statusCode: 200,
  body: JSON.stringify({ stats: 'OK' })
})
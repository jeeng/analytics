import Joi from 'joi'
import Redis from '../../redis'
import Schemas from './validationSchemas';

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
  if (!!error) {
    console.log(JSON.stringify({
      at: 'collectTelemetry:inputValidation',
      err: error
    }))
    return callback(null, {
      statusCode: 500,
      body: JSON.stringify({error: 'Input Error has occured.'})
    })
  }

  redis.getClient()
    .then(redisClient => {
      callback(null, response)
    }).catch(err => callback(null, {
      statusCode: 200,
      body: JSON.stringify(err)
    }))
}
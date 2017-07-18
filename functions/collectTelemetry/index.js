import Redis from '../../redis';

const redis = new Redis()

export default function (event, context, callback) {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  redis.getReady()
    .then(() => callback(null, response))
    .catch(err => callback(null, {
      statusCode: 200,
      body: JSON.stringify(err)
    }))
}
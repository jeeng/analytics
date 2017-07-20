import redis from 'redis'
import config from './config'
import { errorBuilder } from '../utils'

export default class Redis {
  constructor() {
    this.clientReady = false
    this.redisClient = null
  }

  getClient() {
    if (this.clientReady)
      return Promise.resolve(this.redisClient)

    this.redisClient = redis.createClient(config.connection)
    return new Promise((resolve, reject) => {
      this.redisClient.on('error', err =>
        reject(errorBuilder({ at: 'Redis:startup', err })))
      this.redisClient.on('ready', () => { this.clientReady = true; resolve(this.redisClient) })
    });
  }

  mget(keys) {
    const mgetPromise = new Promise((resolve, reject) =>
      this.getClient().then(client =>
        client.mget(keys, (err, response) =>
          !!err ? reject(err) : resolve(response)
        )
      )
    )

    return mgetPromise
      .then(values => values.map((value, i) => ({ value, key: keys[i] })))
      .catch(err => errorBuilder({
        at: 'Redis.mget',
        err
      }))
  }

  lrange(key, start, end) {
    const lrangePromise = new Promise((resolve, reject) =>
      this.getClient().then(client =>
        client.lrange(key, start, end, (err, response) =>
          !!err ? reject(err) : resolve(response)
        )
      )
    )

    return lrangePromise

    // return lrangePromise
    //   .then(values => values.map((value, i) => ({ value, key: keys[i] })))
    //   .catch(err => errorBuilder({
    //     at: 'Redis.mget',
    //     err
    //   }))
  }

  closeClient() {
    this.redisClient && this.redisClient.quit()
    this.clientReady = false
    this.redisClient = null
    return true
  }




};

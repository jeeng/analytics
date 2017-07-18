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

  closeClient() {
    return this.redisClient.quit()
  }




};

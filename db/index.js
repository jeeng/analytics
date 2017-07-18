import { Client } from 'pg'
import config from './config'

export default class DB {
  constructor() {
    this.client = new Client(config)
  }

  runQuery(q) {
    return this.client.connect()
      .catch(err => {
        if (err.stack.includes('Error: Client has already been connected. You cannot reuse a client.'))
          return true
        return Promise.reject({
          at: 'DB.runQuery:client.connect',
          err,
          stack: err.stack,
        })
      })
      .then(() => this.client.query(q))
      .catch(err => Promise.reject({
        at: 'DB.runQuery',
        err: JSON.stringify(err),
        q
      }))
  }

  resolveQuery(q, resultEditor) {
    return this.runQuery(q)
      .then(resultEditor)
      .catch(err => Promise.reject({ at: 'DB.resolveQuery', message: err.message, err, q }))
  }

  resolveQueryToSingleValue(q, valueName) {
    return this.resolveQuery(q, result => result.rows.length === 0 ? null : result.rows[0][valueName])
  }

  resolveQueryToRows(q) {
    return this.resolveQuery(q, result => {
      return result.rows
    }).catch(err => Promise.reject({ at: 'DB.resolveQueryToRows', err }))
  }

  resolveQueryToObject(q, fieldKey, valueKey) {
    return this.resolveQuery(q, result => {
      const response = {}
      result.rows.map(row => {
        response[row[fieldKey]] = row[valueKey]
      })
      return response
    })
  }

  closeClient() {
    return this.client.end()
  }
}
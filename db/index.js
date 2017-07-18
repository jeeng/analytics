import { Client } from 'pg'
import config from './config'

const client = new Client(config.connection)

export default class DB {

  static runQuery(q) {
    return client.connect()
      .catch(err => {
        if (err.stack.includes('Error: Client has already been connected. You cannot reuse a client.'))
          return true
        return Promise.reject({
          at: 'DB.runQuery:client.connect',
          err,
          stack: err.stack
        })
      })
      .then(() => client.query(q))
      .catch(err => Promise.reject({
        at: 'DB.runQuery',
        err: JSON.stringify(err)
      }))
  }

  static resolveQuery(q, resultEditor) {
    return this.runQuery(q)
      .then(result => resultEditor(result))
      .catch(err => Promise.reject({ at: 'DB.resolveQuery', message: err.message, err }))
  }

  static resolveQueryToSingleValue(q, valueName) {
    return this.resolveQuery(q, result => result.rows.length === 0 ? null : result.rows[0][valueName])
  }

  static resolveQueryToRows(q) {
    return this.resolveQuery(q, result => {
      return result.rows
    }).catch(err => Promise.reject({ at: 'DB.resolveQueryToRows', err }))
  }

  static resolveQueryToObject(q, fieldKey, valueKey) {
    return this.resolveQuery(q, result => {
      const response = {}
      result.rows.map(row => {
        response[row[fieldKey]] = row[valueKey]
      })
      return response
    })
  }
}
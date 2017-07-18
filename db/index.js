import pg from 'pg'
import config from './config'

const { connectionString } = config


export default class DB {

  static runQuery(q) {
    return new Promise((resolve, reject) => {
      pg.connect(connectionString, (err, client, done) => {
        if (client === null)
          return reject({ at: 'DB.runQuery', err: 'Client connect Error.' })
        client.query(q, (err, result) => {
          done();
          if (err) return reject({ at: 'DB.runQuery', message: err.message, err, q })
          return resolve(result)
        });
      });
    })
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
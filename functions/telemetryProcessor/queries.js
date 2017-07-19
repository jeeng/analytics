import DB from '../../db'
import { decodeId } from '../../utils'

const db = new DB()

export default class Queries {
  static getNextTimestamp() {
    const q = `
      SELECT CASE WHEN
         MAX(created_at) IS NULL
        THEN
          date_trunc('hour',NOW()) - interval '1 day'
        ELSE
          date_trunc('hour',MAX(created_at) + interval '30 minutes') + interval '1 hour'
        END::varchar AS next_ts
      FROM service.telemetries
    `

    return db.resolveQuery(q, ({ rows }) => rows[0] && rows[0].next_ts)
  }

  static insertTelemetries(telemetries) {
    const values = telemetries
      .map(({
        notification_type,
        telemetry_type,
        created_at = null,
        session_id = null,
        widget_id = null,
        domain_id = null,
        jeeng_id = null,
        user_id = null,
        cta_id = null }) => `(${[
          created_at,
          !!notification_type ?
            `(SELECT id FROM service.notification_types WHERE name = ${notification_type})` : null,
          `(SELECT id FROM service.telemetry_types WHERE name = ${telemetry_type})`,
          decodeId(session_id) || null,
          decodeId(widget_id) || null,
          decodeId(jeeng_id) || null,
          decodeId(user_id) || null,
          decodeId(cta_id || null)
        ].join(',')})`)

    if (!values.length)
      return Promise.resolve(true)

    const q = `
      INSERT INTO service.telemetries
      (
        notification_type_id,
        telemetry_type,
        created_at,
        session_id,
        widget_id,
        domain_id,
        jeeng_id,
        user_id,
        cta_id
      )
      VALUES ${values.join(',')}
    `

    return db.runQuery(q)
  }

  static closeClient() {
    return db.closeClient()
  }
};

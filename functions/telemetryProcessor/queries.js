import DB from '../../db'
import { decodeId } from '../../utils'

const db = new DB()

export default class Queries {
  static getInitData() {
    const q = `
      WITH next_insertion_time AS (
        SELECT
          CASE WHEN
            MAX(created_at) IS NULL
          THEN
            date_trunc('hour',NOW()) - interval '1 day'
          ELSE
            CASE WHEN
              date_trunc('hour',MAX(created_at)) = MAX(created_at)
            THEN
              MAX(created_at) + interval '1 hour'
            ELSE
              date_trunc('hour',MAX(created_at)) + interval '2 hours'
            END
          END::timestamp AS next_ts
        FROM service.telemetries
      )

      , telemetry_types AS (
        SELECT
          json_agg(json_build_object('id',id,'name',name)) AS telemetry_types
        FROM service.telemetry_types
      )

      , notification_types AS (
        SELECT
          json_agg(json_build_object('id',id,'name',name)) AS notification_types
        FROM service.notification_types
      )

      SELECT
        next_ts::varchar, next_ts <= NOW() AS valid_ts,
        (SELECT telemetry_types FROM telemetry_types),
        (SELECT notification_types FROM notification_types)
      FROM next_insertion_time
    `

    return db.resolveQuery(q, ({ rows }) => {
      const telemetry_types = {}
      const notification_types = {}
      rows[0] && rows[0].telemetry_types
        .map(({ id, name }) => telemetry_types[name] = id)
      rows[0] && rows[0].notification_types
        .map(({ id, name }) => notification_types[name] = id)
      const next_ts = rows[0] && rows[0].valid_ts
        && rows[0].next_ts || null

      return { next_ts, telemetry_types, notification_types }
    })
  }

  static insertTelemetries({ telemetries, nextTimestamp }) {
    const values = telemetries
      .map(({
        notification_type_id,
        telemetry_type_id,
        created_at = null,
        session_id = null,
        widget_id = null,
        domain_id = null,
        jeeng_id = null,
        user_id = null,
        cta_id = null }) => `(${[
          notification_type_id || 'null',
          telemetry_type_id,
          `'${created_at}'`,
          decodeId(session_id) || 'null',
          decodeId(widget_id) || 'null',
          decodeId(domain_id) || 'null',
          decodeId(jeeng_id) || 'null',
          decodeId(user_id) || 'null',
          decodeId(cta_id) || 'null'
        ].join(',')})`)

    const q = !!values.length ? `
      INSERT INTO service.telemetries
      (
        notification_type_id,
        telemetry_type_id,
        created_at,
        session_id,
        widget_id,
        domain_id,
        jeeng_id,
        user_id,
        cta_id
      )
      VALUES ${values.join(',')}
    ` : `
      INSERT INTO service.telemetries
      (
        telemetry_type_id,
        created_at
      )
      VALUES (
        (SELECT id FROM service.telemetry_types WHERE name = 'NO_DATA'),
        '${nextTimestamp}'
      )
    `

    return db.runQuery(q)
  }

  static closeClient() {
    return db.closeClient()
  }
};

import DB from '../../db'
import { encodeId } from '../../utils'

const db = new DB()

export default class Queries {
  static getActiveWidgets() {
    const q = `
     SELECT id
     FROM service.widgets
     WHERE activated = TRUE
    `

    return db.resolveQuery(q, ({ rows }) =>
      rows.map(({ id }) => encodeId(id)))
  }

  static getNextTimestamp() {
    const q = `
      WITH next_insertion_time AS (
        SELECT
          CASE WHEN
            MAX(hour) IS NULL
          THEN
            date_trunc('hour',NOW()) - interval '24 hours'
          ELSE
            MAX(hour) + interval '1 hour'
          END::timestamp AS next_ts
        FROM service.hourly_widget_telemetries
        WHERE telemetry_type_id = (SELECT id FROM service.telemetry_types WHERE name = 'WIDGET_SEEN')
      )

      SELECT next_ts::varchar, next_ts <=NOW() AS valid_ts
      FROM next_insertion_time
    `

    console.log(q);

    return db.resolveQuery(q, ({ rows }) =>
      rows[0] && rows[0].valid_ts && rows[0].next_ts)
  }

  static insertWidgetSeens(widgetSeenDataPoints) {
    const values = widgetSeenDataPoints
      .map(({ ts, widgetId, count }) => (`('${ts}', ${widgetId}, ${count},(SELECT id FROM service.telemetry_types WHERE name = 'WIDGET_SEEN'))`))

    if (!values.length)
      return Promise.resolve(true)

    const q = `
      INSERT INTO service.hourly_widget_telemetries
      (hour, widget_id, count, telemetry_type_id)
      VALUES ${values.join(',')}
      ON CONFLICT ON CONSTRAINT unique_hourly_widget_seens
      DO NOTHING
    `
    console.log(q);

    return db.runQuery(q)
  }

  static closeClient() {
    return db.closeClient()
  }
};

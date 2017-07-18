import DB from '../../db'
import { encodeId } from '../../utils'

export default class Queries {
  static getActiveWidgets() {
    const q = `
     SELECT id
     FROM service.widgets
     WHERE activated = TRUE
    `

    return DB.resolveQuery(q, ({ rows }) =>
      rows.map(({ id }) => encodeId(id)))
  }

  static getMissingTimestamps() {
    const q = `
      WITH latest_insertion AS (
        SELECT CASE WHEN
         MAX(created_at) IS NULL
        THEN
          date_trunc('hour',NOW()) - interval '1 day'
        ELSE
          MAX(created_at) + interval '1 hour'
        END AS timestamp
        FROM service.hourly_widget_seens
      )

      SELECT ts::timestamp
      FROM generate_series(
        (SELECT timestamp FROM latest_insertion),
        date_trunc('hour',NOW()),
        '1 hour'::interval
      ) ts
    `

    return DB.resolveQuery(q, ({ rows }) =>
      rows.map(({ ts }) => timestamp))
  }

  static insertWidgetSeens(widgetSeenDataPoints) {
    const values = []
    widgetSeenDataPoints.map(({ widgetId, timestamp, data }) => {
      Object.keys(data).map(ctaId =>
        values.push(`(${timestamp}, ${widgetId}, ${ctaId}, ${data[ctaId]})`)
      )
    })

    const q = `
      INSERT INTO service.hourly_widget_seens
      (hour, widget_id, cta_id, count)
      VALUES ${values.join(',')}
      ON CONFLICT ON CONSTRAINT unique_hourly_widget_seens
      DO NOTHING
    `

    return DB.runQuery(q)
  }
};

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

    return db.resolveQuery(q, ({ rows }) =>
      rows.map(({ ts }) => ts))
  }

  static insertWidgetSeens(widgetSeenDataPoints) {
    const values = []
    widgetSeenDataPoints
      .map(({ widgetId, timestamp, data }) => {
        Object.keys(data).map(ctaId =>
          values.push(`(${timestamp}, ${widgetId}, ${ctaId}, ${data[ctaId]})`)
        )
      })

    if (!values.length)
      return Promise.resolve(true)

    const q = `
      INSERT INTO service.hourly_widget_seens
      (hour, widget_id, cta_id, count)
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

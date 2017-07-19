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
      SELECT CASE WHEN
         MAX(created_at) IS NULL
        THEN
          date_trunc('hour',NOW()) - interval '1 day'
        ELSE
          MAX(created_at) + interval '1 hour'
        END::varchar AS next_ts
        FROM service.hourly_widget_seens
    `

    return db.resolveQuery(q, ({ rows }) => rows[0] && rows[0].next_ts)
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

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
      SELECT timestamp
      FROM generate_series(
        date_trunc('hour',NOW()) - interval '3 hours',
        date_trunc('hour',NOW()),
        '1 hour'::interval
      ) timestamp
    `

    return DB.resolveQuery(q, ({ rows }) =>
      rows.map(({ timestamp }) => timestamp))
  }

  static insertWidgetSeens(widgetSeenDataPoints) {
    return null
  }
};

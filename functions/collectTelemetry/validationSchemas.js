import Joi from 'joi'

export default {
  request: {
    body: Joi.object().keys({
      telemetry_type: Joi.string().required(),
      notification_type: Joi.string().allow(null),
      session_id: Joi.string().allow(null),
      widget_id: Joi.string().allow(null),
      jeeng_id: Joi.string().allow(null),
      user_id: Joi.string().allow(null),
      cta_id: Joi.string().allow(null),
    })
  }
}
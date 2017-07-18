import Joi from 'joi'

export default {
  request: {
    body: Joi.object().keys({
      telemetry_type: Joi.string().required(),
      notification_type: Joi.string(),
      session_id: Joi.string(),
      widget_id: Joi.string(),
      jeeng_id: Joi.string(),
      user_id: Joi.string(),
      cta_id: Joi.string(),
    })
  }
}
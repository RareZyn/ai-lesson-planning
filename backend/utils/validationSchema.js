const Joi = require('joi');

// Define the schema that the AI's JSON output MUST follow.
// This matches the structure you expect.
exports.lessonPlanValidationSchema = Joi.object({
    learningObjective: Joi.string().min(10).required().messages({
        'string.empty': 'Learning objective cannot be empty.',
        'any.required': 'Learning objective is a required field.'
    }),
    successCriteria: Joi.array().items(Joi.string()).min(1).required().messages({
        'array.min': 'At least one success criterion is required.',
        'any.required': 'Success criteria are required.'
    }),
    activities: Joi.object({
        preLesson: Joi.array().items(Joi.string()).min(1).required(),
        duringLesson: Joi.array().items(Joi.string()).min(1).required(),
        postLesson: Joi.array().items(Joi.string()).min(1).required()
    }).required().messages({
        'object.base': 'Activities object with pre, during, and post lesson stages is required.'
    })
});
const { z } = require('zod');

const STATUSES = ['saved', 'applied', 'interview', 'offer', 'rejected', 'ghosted'];
const TRACKS = ['full-stack', 'data-analyst', 'internship', 'other'];

const applicationSchema = z.object({
  company: z.string().trim().min(1, 'Company is required').max(120),
  role: z.string().trim().min(1, 'Role is required').max(160),
  track: z.enum(TRACKS).default('full-stack'),
  location: z.string().trim().max(120).optional().nullable(),
  work_setup: z.enum(['on-site', 'hybrid', 'remote']).optional().nullable(),
  job_url: z.string().url('Job link must be a valid URL').optional().nullable(),
  status: z.enum(STATUSES).default('applied'),
  applied_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').optional(),
  notes: z.string().max(2000).optional().nullable(),
});

const updateSchema = applicationSchema.partial().refine(
  (body) => Object.keys(body).length > 0,
  { message: 'Send at least one field to update' }
);

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { applicationSchema, updateSchema, validate, STATUSES, TRACKS };

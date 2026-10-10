const express = require('express');
const { applicationSchema, updateSchema, validate, STATUSES } = require('../validation');

const COLUMNS = ['company', 'role', 'track', 'location', 'work_setup', 'job_url', 'status', 'applied_on', 'notes'];

module.exports = function applicationsRouter(pool) {
  const router = express.Router();

  // GET /api/applications?status=interview&track=data-analyst&q=analyst&sort=applied_on&order=desc
  router.get('/', async (req, res, next) => {
    try {
      const { status, track, q } = req.query;
      const sort = ['applied_on', 'company', 'status', 'updated_at'].includes(req.query.sort)
        ? req.query.sort : 'applied_on';
      const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

      const where = [];
      const params = [];
      if (status) {
        if (!STATUSES.includes(status)) return res.status(400).json({ error: `Unknown status "${status}"` });
        params.push(status);
        where.push(`status = $${params.length}`);
      }
      if (track) {
        params.push(track);
        where.push(`track = $${params.length}`);
      }
      if (q) {
        params.push(`%${q.toLowerCase()}%`);
        where.push(`(LOWER(company) LIKE $${params.length} OR LOWER(role) LIKE $${params.length})`);
      }

      const sql = `SELECT * FROM applications
                   ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                   ORDER BY ${sort} ${order}, id DESC`;
      const { rows } = await pool.query(sql, params);
      res.json(rows);
    } catch (err) { next(err); }
  });

  // GET /api/applications/stats  -> counts by status and response rate
  router.get('/stats', async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `SELECT status, COUNT(*)::int AS count FROM applications GROUP BY status`
      );
      const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
      rows.forEach((r) => { byStatus[r.status] = r.count; });
      const submitted = STATUSES.filter((s) => s !== 'saved').reduce((n, s) => n + byStatus[s], 0);
      const responded = byStatus.interview + byStatus.offer + byStatus.rejected;
      res.json({
        total: Object.values(byStatus).reduce((a, b) => a + b, 0),
        byStatus,
        responseRate: submitted ? Math.round((responded / submitted) * 100) : 0,
        interviewRate: submitted ? Math.round(((byStatus.interview + byStatus.offer) / submitted) * 100) : 0,
      });
    } catch (err) { next(err); }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const { rows } = await pool.query('SELECT * FROM applications WHERE id = $1', [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'Application not found' });
      const history = await pool.query(
        'SELECT from_status, to_status, changed_at FROM status_history WHERE application_id = $1 ORDER BY changed_at, id',
        [req.params.id]
      );
      res.json({ ...rows[0], history: history.rows });
    } catch (err) { next(err); }
  });

  router.post('/', validate(applicationSchema), async (req, res, next) => {
    try {
      const fields = COLUMNS.filter((c) => req.body[c] !== undefined);
      const values = fields.map((c) => req.body[c]);
      const placeholders = fields.map((_, i) => `$${i + 1}`);
      const { rows } = await pool.query(
        `INSERT INTO applications (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
        values
      );
      await pool.query(
        'INSERT INTO status_history (application_id, from_status, to_status) VALUES ($1, NULL, $2)',
        [rows[0].id, rows[0].status]
      );
      res.status(201).json(rows[0]);
    } catch (err) { next(err); }
  });

  router.patch('/:id', validate(updateSchema), async (req, res, next) => {
    try {
      const existing = await pool.query('SELECT status FROM applications WHERE id = $1', [req.params.id]);
      if (!existing.rows.length) return res.status(404).json({ error: 'Application not found' });

      const fields = COLUMNS.filter((c) => req.body[c] !== undefined);
      const sets = fields.map((c, i) => `${c} = $${i + 1}`);
      const values = fields.map((c) => req.body[c]);
      values.push(req.params.id);
      const { rows } = await pool.query(
        `UPDATE applications SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
        values
      );

      const oldStatus = existing.rows[0].status;
      if (req.body.status && req.body.status !== oldStatus) {
        await pool.query(
          'INSERT INTO status_history (application_id, from_status, to_status) VALUES ($1, $2, $3)',
          [req.params.id, oldStatus, req.body.status]
        );
      }
      res.json(rows[0]);
    } catch (err) { next(err); }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const { rowCount } = await pool.query('DELETE FROM applications WHERE id = $1', [req.params.id]);
      if (!rowCount) return res.status(404).json({ error: 'Application not found' });
      res.status(204).end();
    } catch (err) { next(err); }
  });

  return router;
};

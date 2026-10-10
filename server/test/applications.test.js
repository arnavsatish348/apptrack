const request = require('supertest');
const { newDb } = require('pg-mem');
const { createApp } = require('../src/app');
const { schema } = require('../src/db');

// Runs the real SQL schema against an in-memory Postgres, so tests need no database server
function makeTestPool() {
  const db = newDb();
  db.public.none(schema);
  const { Pool } = db.adapters.createPg();
  return new Pool();
}

let app;
beforeEach(() => {
  app = createApp(makeTestPool());
});

const sample = {
  company: 'PCS Wireless',
  role: 'Junior Data Analyst',
  track: 'data-analyst',
  location: 'Florham Park, NJ',
  work_setup: 'on-site',
  applied_on: '2026-10-10',
};

describe('POST /api/applications', () => {
  test('creates an application and records its first status', async () => {
    const res = await request(app).post('/api/applications').send(sample).expect(201);
    expect(res.body).toMatchObject({ company: 'PCS Wireless', status: 'applied' });

    const detail = await request(app).get(`/api/applications/${res.body.id}`).expect(200);
    expect(detail.body.history).toHaveLength(1);
    expect(detail.body.history[0].to_status).toBe('applied');
  });

  test('rejects missing required fields with a clear message', async () => {
    const res = await request(app).post('/api/applications').send({ role: 'Analyst' }).expect(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'company' })])
    );
  });

  test('rejects an unknown status', async () => {
    await request(app).post('/api/applications').send({ ...sample, status: 'maybe' }).expect(400);
  });
});

describe('GET /api/applications', () => {
  beforeEach(async () => {
    await request(app).post('/api/applications').send(sample);
    await request(app).post('/api/applications').send({
      company: '32BJ Benefit Funds', role: 'Junior Full Stack Developer', track: 'full-stack', status: 'interview',
    });
  });

  test('lists all applications', async () => {
    const res = await request(app).get('/api/applications').expect(200);
    expect(res.body).toHaveLength(2);
  });

  test('filters by status', async () => {
    const res = await request(app).get('/api/applications?status=interview').expect(200);
    expect(res.body.map((a) => a.company)).toEqual(['32BJ Benefit Funds']);
  });

  test('searches company and role text', async () => {
    const res = await request(app).get('/api/applications?q=analyst').expect(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('PATCH /api/applications/:id', () => {
  test('updates status and adds a history entry', async () => {
    const created = await request(app).post('/api/applications').send(sample);
    await request(app).patch(`/api/applications/${created.body.id}`).send({ status: 'interview' }).expect(200);

    const detail = await request(app).get(`/api/applications/${created.body.id}`);
    expect(detail.body.status).toBe('interview');
    expect(detail.body.history.map((h) => h.to_status)).toEqual(['applied', 'interview']);
  });

  test('returns 404 for a missing application', async () => {
    await request(app).patch('/api/applications/999').send({ status: 'offer' }).expect(404);
  });
});

describe('GET /api/applications/stats', () => {
  test('computes counts and response rate', async () => {
    await request(app).post('/api/applications').send(sample);
    await request(app).post('/api/applications').send({ ...sample, company: 'A', status: 'interview' });
    await request(app).post('/api/applications').send({ ...sample, company: 'B', status: 'rejected' });
    await request(app).post('/api/applications').send({ ...sample, company: 'C', status: 'saved' });

    const res = await request(app).get('/api/applications/stats').expect(200);
    expect(res.body.total).toBe(4);
    expect(res.body.byStatus.interview).toBe(1);
    // 3 submitted (saved doesn't count), 2 got a response
    expect(res.body.responseRate).toBe(67);
    expect(res.body.interviewRate).toBe(33);
  });
});

describe('DELETE /api/applications/:id', () => {
  test('deletes an application', async () => {
    const created = await request(app).post('/api/applications').send(sample);
    await request(app).delete(`/api/applications/${created.body.id}`).expect(204);
    await request(app).get(`/api/applications/${created.body.id}`).expect(404);
  });
});

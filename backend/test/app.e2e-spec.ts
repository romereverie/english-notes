import type { Server } from 'node:http';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

type Where = { id?: number; userId?: number };
type StoredNote = {
  id: number;
  userId: number | null;
  title: string;
  content: string;
};
describe('Notes access and validation (HTTP)', () => {
  let app: INestApplication;
  let tokenA: string;
  let tokenB: string;
  let notes: Array<{
    id: number;
    userId: number | null;
    title: string;
    content: string;
  }>;
  const matches = (
    note: (typeof notes)[number],
    where: { id?: number; userId?: number },
  ) =>
    (where.id === undefined || note.id === where.id) &&
    (where.userId === undefined || note.userId === where.userId);
  let users: Array<{
    id: number;
    nickname: string;
    passwordHash: string;
    createdAt: Date;
  }> = [];
  const prisma = {
    user: {
      findUnique: jest.fn(({ where }: { where: { nickname: string } }) =>
        Promise.resolve(
          users.find((user) => user.nickname === where.nickname) ?? null,
        ),
      ),
      create: jest.fn(
        ({ data }: { data: { nickname: string; passwordHash: string } }) => {
          const user = { id: users.length + 1, ...data, createdAt: new Date() };
          users.push(user);
          return Promise.resolve(user);
        },
      ),
    },
    note: {
      findMany: jest.fn(({ where }: { where: Where }) =>
        Promise.resolve(notes.filter((n) => matches(n, where))),
      ),
      findFirst: jest.fn(({ where }: { where: Where }) =>
        Promise.resolve(notes.find((n) => matches(n, where)) ?? null),
      ),
      create: jest.fn(({ data }: { data: Omit<StoredNote, 'id'> }) => {
        const note = { id: 10, ...data };
        notes.push(note);
        return Promise.resolve(note);
      }),
      updateMany: jest.fn(
        ({ where, data }: { where: Where; data: Partial<StoredNote> }) => {
          const note = notes.find((n) => matches(n, where));
          if (note) Object.assign(note, data);
          return Promise.resolve({ count: note ? 1 : 0 });
        },
      ),
      deleteMany: jest.fn(({ where }: { where: Where }) => {
        const before = notes.length;
        notes = notes.filter((n) => !matches(n, where));
        return Promise.resolve({ count: before - notes.length });
      }),
    },
  };
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-for-http-tests-at-least-32-bytes';
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    const jwt = module.get(JwtService);
    tokenA = jwt.sign({ sub: 1, nickname: 'alice' });
    tokenB = jwt.sign({ sub: 2, nickname: 'bob' });
  });
  beforeEach(() => {
    users = [];
    notes = [
      { id: 1, userId: 1, title: 'Private', content: 'Secret' },
      { id: 2, userId: null, title: 'Legacy', content: '' },
    ];
  });
  afterAll(async () => {
    await app.close();
  });
  const api = () => request(app.getHttpServer() as Server);
  it('registers with a hash, logs in and rejects invalid credentials and duplicates', async () => {
    const credentials = { nickname: 'newuser', password: 'test-pass-123' };
    const registered = await api()
      .post('/auth/register')
      .send(credentials)
      .expect(201);
    expect(registered.body).not.toHaveProperty('passwordHash');
    expect(users[0].passwordHash).not.toBe(credentials.password);
    const signedIn = await api()
      .post('/auth/login')
      .send(credentials)
      .expect(201);
    const payload: { sub: number } = app
      .get(JwtService)
      .verify((signedIn.body as { accessToken: string }).accessToken);
    expect(payload.sub).toBe(users[0].id);
    await api()
      .post('/auth/login')
      .send({ ...credentials, password: 'wrong-password' })
      .expect(401);
    await api().post('/auth/register').send(credentials).expect(409);
  });
  it('rejects invalid registration and oversized UTF-8 passwords', async () => {
    await api()
      .post('/auth/register')
      .send({ nickname: 'ab', password: '123' })
      .expect(400);
    await api()
      .post('/auth/register')
      .send({ nickname: 'valid', password: 'я'.repeat(40) })
      .expect(400);
  });
  it('rejects unauthenticated requests', async () => {
    await api().get('/notes').expect(401);
  });
  it('lists only owned notes and hides legacy notes', async () => {
    const response = await api()
      .get('/notes')
      .auth(tokenA, { type: 'bearer' })
      .expect(200);
    expect(
      (response.body as StoredNote[]).map((n: { id: number }) => n.id),
    ).toEqual([1]);
    await api().get('/notes').auth(tokenB, { type: 'bearer' }).expect(200, []);
  });
  it('prevents another user from reading, editing and deleting a note', async () => {
    await api().get('/notes/1').auth(tokenB, { type: 'bearer' }).expect(404);
    await api()
      .put('/notes/1')
      .auth(tokenB, { type: 'bearer' })
      .send({ title: 'Stolen' })
      .expect(404);
    await api().delete('/notes/1').auth(tokenB, { type: 'bearer' }).expect(404);
    expect(notes[0].title).toBe('Private');
    expect(notes).toHaveLength(2);
  });
  it('assigns ownership from JWT and supports content CRUD', async () => {
    const created = await api()
      .post('/notes')
      .auth(tokenB, { type: 'bearer' })
      .send({ title: ' Grammar ', content: 'Present perfect' })
      .expect(201);
    expect(created.body).toMatchObject({
      userId: 2,
      title: 'Grammar',
      content: 'Present perfect',
    });
    await api()
      .put('/notes/10')
      .auth(tokenB, { type: 'bearer' })
      .send({ content: 'Updated' })
      .expect(200);
    await api()
      .get('/notes/10')
      .auth(tokenB, { type: 'bearer' })
      .expect(200)
      .expect(({ body }) =>
        expect((body as StoredNote).content).toBe('Updated'),
      );
    await api()
      .delete('/notes/10')
      .auth(tokenB, { type: 'bearer' })
      .expect(200);
  });
  it('rejects malformed IDs, whitespace titles, null titles and owner injection', async () => {
    await api().get('/notes/abc').auth(tokenA, { type: 'bearer' }).expect(400);
    for (const body of [
      { title: '  ' },
      { title: 'Valid', userId: 2 },
      { title: 'Valid', unexpected: true },
    ])
      await api()
        .post('/notes')
        .auth(tokenA, { type: 'bearer' })
        .send(body)
        .expect(400);
    await api()
      .put('/notes/1')
      .auth(tokenA, { type: 'bearer' })
      .send({ title: null })
      .expect(400);
  });
  it('rejects an expired JWT', async () => {
    const jwt = app.get(JwtService).sign({ sub: 1 }, { expiresIn: -1 });
    await api().get('/notes').auth(jwt, { type: 'bearer' }).expect(401);
  });
});

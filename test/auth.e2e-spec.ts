import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = `test-${Date.now()}@example.com`;
  const password = 'password123';
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.users.deleteMany({ where: { email } });
    await app.close();
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.email).toEqual(email);
        expect(res.body.id).toBeDefined();
        expect(res.body.password_hash).toBeUndefined();
      });
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
        jwtToken = res.body.access_token;
      });
  });

  it('/ (GET) - Protected Route (Should be Forbidden/Unauthorized)', () => {
    // Without token
    request(app.getHttpServer()).get('/').expect(401);

    // With token (but no admin role)
    return request(app.getHttpServer())
      .get('/')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(403); // Forbidden because of RolesGuard
  });

  it('/public (GET) - Public Route', () => {
    return request(app.getHttpServer())
      .get('/public')
      .expect(200)
      .expect('This is public area');
  });
});

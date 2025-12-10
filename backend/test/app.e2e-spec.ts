import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/admin/workspaces (GET)', () => {
    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/admin/workspaces')
        .expect(401);
    });
  });

  describe('Health check', () => {
    it('should respond to root path', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect((res) => {
          // Just check the app is running
          expect(res.status).toBeDefined();
        });
    });
  });
});


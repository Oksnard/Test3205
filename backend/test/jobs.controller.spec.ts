import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { URL_CHECKER_OPTIONS } from '../src/jobs/url-checker.options';

describe('JobsController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(URL_CHECKER_OPTIONS)
      .useValue({
        fetchFn: async () => new Response(null, { status: 200 }),
        delayFn: async () => undefined,
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/jobs creates a job', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/jobs')
      .send({ urls: ['https://example.com'] })
      .expect(201);

    expect(response.body.jobId).toBeDefined();
  });

  it('GET /api/jobs returns list', async () => {
    await request(app.getHttpServer()).get('/api/jobs').expect(200);
  });
});

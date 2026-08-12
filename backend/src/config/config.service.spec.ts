import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  it('loads safe development defaults', () => {
    const config = new ConfigService({}).load();

    assert.equal(config.environment, 'development');
    assert.equal(config.port, 3000);
    assert.equal(config.corsOrigin, 'http://localhost:3000');
  });

  it('parses explicit configuration values', () => {
    const config = new ConfigService({
      NODE_ENV: 'test',
      PORT: '4000',
      DATABASE_URL: 'postgres://example',
      JWT_SECRET: 'secret',
      CORS_ORIGIN: 'https://example.com',
    }).load();

    assert.deepEqual(config, {
      environment: 'test',
      port: 4000,
      databaseUrl: 'postgres://example',
      jwtSecret: 'secret',
      corsOrigin: 'https://example.com',
    });
  });

  it('rejects invalid ports and environments', () => {
    assert.throws(() => new ConfigService({ PORT: '0' }).load(), /PORT/);
    assert.throws(() => new ConfigService({ PORT: 'abc' }).load(), /PORT/);
    assert.throws(() => new ConfigService({ NODE_ENV: 'staging' }).load(), /NODE_ENV/);
  });

  it('requires database and JWT secrets in production', () => {
    assert.throws(() => new ConfigService({ NODE_ENV: 'production' }).load(), /DATABASE_URL, JWT_SECRET/);
    assert.equal(
      new ConfigService({ NODE_ENV: 'production', DATABASE_URL: 'postgres://example', JWT_SECRET: 'secret' }).load().environment,
      'production',
    );
  });
});

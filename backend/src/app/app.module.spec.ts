import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConfigService } from '../config';
import { AppModule } from './app.module';

describe('AppModule', () => {
  it('wires configuration and health services', () => {
    const app = new AppModule(new ConfigService({ NODE_ENV: 'test', PORT: '4001' }));

    assert.equal(app.config.environment, 'test');
    assert.equal(app.config.port, 4001);
    assert.equal(app.healthService.check().status, 'ok');
  });
});

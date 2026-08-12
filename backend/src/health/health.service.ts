import { AppConfig } from '../config';
import { HealthReport } from './health.types';

export class HealthService {
  constructor(private readonly config: AppConfig, private readonly now: () => Date = () => new Date()) {}

  check(): HealthReport {
    return {
      status: 'ok',
      service: 'college-geeks-backend',
      environment: this.config.environment,
      timestamp: this.now().toISOString(),
    };
  }
}

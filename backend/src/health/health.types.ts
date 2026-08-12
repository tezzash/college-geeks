export interface HealthReport {
  status: 'ok';
  service: string;
  environment: string;
  timestamp: string;
}

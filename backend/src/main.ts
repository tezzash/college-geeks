import { AppModule } from './app';
import { HttpApiServer } from './api';

export function bootstrap(): { app: AppModule; server: HttpApiServer } {
  const app = new AppModule();
  const server = new HttpApiServer(app);
  void server.listen().then(() => {
    console.log(`College Geeks API listening on port ${app.config.port}.`);
  }).catch((error) => {
    console.error('Failed to start API server.', error);
    process.exitCode = 1;
  });
  return { app, server };
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

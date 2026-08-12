import { AppModule } from './app';

export function bootstrap(): AppModule {
  const app = new AppModule();
  console.log(`College Geeks backend foundation ready on port ${app.config.port}.`);
  return app;
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

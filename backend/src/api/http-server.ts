import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';
import { AppModule } from '../app';

export class HttpApiServer {
  private readonly server: Server;

  constructor(private readonly app: AppModule) {
    this.server = createServer((request, response) => {
      void this.handle(request, response);
    });
  }

  listen(): Promise<void> {
    return new Promise((resolve, reject) => {
      const onError = (error: Error) => {
        this.server.off('listening', onListening);
        reject(error);
      };
      const onListening = () => {
        this.server.off('error', onError);
        resolve();
      };
      this.server.once('error', onError);
      this.server.once('listening', onListening);
      this.server.listen(this.app.config.port);
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  private async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    this.applyCors(request, response);
    if (request.method === 'OPTIONS') return this.send(response, 204, null);

    try {
      const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
      const body = ['POST', 'PUT', 'PATCH'].includes(request.method ?? '') ? await this.readJson(request) : {};

      if (request.method === 'GET' && url.pathname === '/health') return this.send(response, 200, this.app.healthService.check());
      if (request.method === 'POST' && url.pathname === '/auth/register') return this.send(response, 201, await this.app.authService.register(body));
      if (request.method === 'POST' && url.pathname === '/auth/login') return this.send(response, 200, await this.app.authService.login(body));

      const playerId = this.requirePlayer(request);
      if (request.method === 'GET' && url.pathname === '/me') {
        return this.send(response, 200, { player: await this.app.databasePlayerService.get(playerId) });
      }
      if (request.method === 'GET' && url.pathname === '/jobs') return this.send(response, 200, { jobs: await this.app.databaseJobsService.listJobs() });
      if (request.method === 'GET' && url.pathname === '/jobs/active') return this.send(response, 200, { activeJob: await this.app.databaseJobsService.getActive(playerId) });

      const jobStart = url.pathname.match(/^\/jobs\/([^/]+)\/start$/);
      if (request.method === 'POST' && jobStart) {
        return this.send(response, 201, { activeJob: await this.app.databaseJobsService.start(playerId, jobStart[1]) });
      }
      const jobCollect = url.pathname.match(/^\/jobs\/active\/([^/]+)\/collect$/);
      if (request.method === 'POST' && jobCollect) {
        return this.send(response, 200, await this.app.databaseJobsService.collect(playerId, jobCollect[1]));
      }
      if (request.method === 'POST' && url.pathname === '/battles') {
        const defenderId = this.stringField(body, 'defenderId');
        const action = this.stringField(body, 'action');
        if (action !== 'punch' && action !== 'face_off') throw new Error('action must be punch or face_off.');
        return this.send(response, 200, await this.app.databaseBattleService.fight(playerId, defenderId, action));
      }

      return this.send(response, 404, { error: 'Route not found.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed.';
      const status = this.statusFor(message);
      return this.send(response, status, { error: message });
    }
  }

  private requirePlayer(request: IncomingMessage): string {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new Error('Authentication required.');
    return this.app.authService.verifyToken(header.slice(7).trim());
  }

  private async readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of request) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > 1_000_000) throw new Error('Request body is too large.');
      chunks.push(buffer);
    }
    if (chunks.length === 0) return {};
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('JSON body must be an object.');
    return parsed as Record<string, unknown>;
  }

  private stringField(body: Record<string, unknown>, name: string): string {
    const value = body[name];
    if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} is required.`);
    return value.trim();
  }

  private statusFor(message: string): number {
    if (message === 'Authentication required.' || message.includes('access token')) return 401;
    if (message === 'Invalid credentials.') return 401;
    if (message.includes('not found')) return 404;
    if (message.includes('already') || message.includes('Insufficient') || message.includes('required') || message.includes('must be') || message.includes('Invalid')) return 400;
    return 500;
  }

  private applyCors(request: IncomingMessage, response: ServerResponse): void {
    const origin = request.headers.origin;
    if (origin && (this.app.config.corsOrigin === '*' || origin === this.app.config.corsOrigin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Vary', 'Origin');
    }
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }

  private send(response: ServerResponse, status: number, payload: unknown): void {
    response.statusCode = status;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (status === 204) return response.end();
    response.end(JSON.stringify(payload));
  }
}

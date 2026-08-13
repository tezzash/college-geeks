import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { DatabasePlayerService } from '../database';

const scrypt = promisify(scryptCallback);
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

interface TokenPayload {
  sub: string;
  exp: number;
}

export class AuthService {
  constructor(
    private readonly players: DatabasePlayerService,
    private readonly secret: string,
    private readonly now: () => number = () => Math.floor(Date.now() / 1000),
  ) {
    if (secret.trim().length < 32) throw new Error('JWT_SECRET must be at least 32 characters.');
  }

  async register(input: { username: string; email: string; password: string }) {
    const username = input.username.trim();
    const email = input.email.trim().toLowerCase();
    this.validateCredentials(username, email, input.password);

    const passwordHash = await this.hashPassword(input.password);
    const player = await this.players.create({ username, email, passwordHash });
    return { player, accessToken: this.createToken(player.id) };
  }

  async login(input: { login: string; password: string }) {
    if (!input.login?.trim() || !input.password) throw new Error('Login and password are required.');
    const credentials = await this.players.findCredentials(input.login.trim());
    if (!credentials || !(await this.verifyPassword(input.password, credentials.passwordHash))) {
      throw new Error('Invalid credentials.');
    }
    return { player: credentials.player, accessToken: this.createToken(credentials.player.id) };
  }

  verifyToken(token: string): string {
    const parts = token.split('.');
    if (parts.length !== 2) throw new Error('Invalid access token.');
    const [encodedPayload, signature] = parts;
    const expected = this.sign(encodedPayload);
    const received = Buffer.from(signature, 'base64url');
    const expectedBuffer = Buffer.from(expected, 'base64url');
    if (received.length !== expectedBuffer.length || !timingSafeEqual(received, expectedBuffer)) {
      throw new Error('Invalid access token.');
    }
    let payload: TokenPayload;
    try {
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as TokenPayload;
    } catch {
      throw new Error('Invalid access token.');
    }
    if (!payload.sub || !Number.isInteger(payload.exp) || payload.exp <= this.now()) {
      throw new Error('Access token expired.');
    }
    return payload.sub;
  }

  private createToken(playerId: string): string {
    const payload: TokenPayload = { sub: playerId, exp: this.now() + TOKEN_TTL_SECONDS };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${encoded}.${this.sign(encoded)}`;
  }

  private sign(value: string): string {
    return createHmac('sha256', this.secret).update(value).digest('base64url');
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return `scrypt$${salt}$${derived.toString('hex')}`;
  }

  private async verifyPassword(password: string, stored: string): Promise<boolean> {
    const [algorithm, salt, digest] = stored.split('$');
    if (algorithm !== 'scrypt' || !salt || !digest) return false;
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    const expected = Buffer.from(digest, 'hex');
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  }

  private validateCredentials(username: string, email: string, password: string): void {
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) throw new Error('Username must be 3-24 characters and use letters, numbers, or _.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('A valid email is required.');
    if (password.length < 8 || password.length > 128) throw new Error('Password must be 8-128 characters.');
  }
}

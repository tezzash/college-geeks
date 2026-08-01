declare module '@nestjs/common' {
  export function Injectable(): ClassDecorator;
  export function Module(metadata: unknown): ClassDecorator;
}

declare const describe: (name: string, fn: () => void) => void;
declare const it: { (name: string, fn: () => unknown | Promise<unknown>): void; each<T extends readonly unknown[]>(cases: readonly T[]): (name: string, fn: (...args: T) => unknown | Promise<unknown>) => void };
declare const expect: (actual: unknown) => { resolves: { toEqual(expected: unknown): Promise<void>; toMatchObject(expected: unknown): Promise<void> } };
declare const jest: { fn<T extends (...args: never[]) => unknown>(implementation?: T): T & { mock: unknown } };
declare namespace jest { type Mock = (...args: unknown[]) => unknown; }

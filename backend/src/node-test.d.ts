declare module 'node:assert/strict' {
  const assert: {
    equal(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    ok(value: unknown, message?: string): void;
    throws(block: () => unknown, error?: RegExp, message?: string): void;
  };
  export default assert;
}

declare module 'node:test' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void): void;
}

declare const console: { log(message?: unknown, ...optionalParams: unknown[]): void };
declare const performance: { now(): number };
declare const process: { env: Record<string, string | undefined> };
declare function structuredClone<T>(value: T): T;

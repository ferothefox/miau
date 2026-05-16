declare module "bun:test" {
  type TestFn = (name: string, fn: () => void | Promise<void>) => void;

  export const describe: TestFn;
  export const test: TestFn;
  export function expect(value: unknown): {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toContain(expected: string): void;
    toHaveLength(expected: number): void;
    not: {
      toContain(expected: string): void;
    };
  };
}

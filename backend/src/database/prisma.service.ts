export type QueryFragment = {
  text: string;
  values: unknown[];
};

export interface PrismaService {
  $queryRaw<T = unknown>(query: QueryFragment): Promise<T>;
}

export const sql = (strings: TemplateStringsArray, ...values: unknown[]): QueryFragment => ({
  text: strings.reduce((query, part, index) => `${query}${part}${index < values.length ? `$${index + 1}` : ''}`, ''),
  values,
});

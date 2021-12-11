import { QueryInput } from "@urql/exchange-graphcache";

function betterUpdateQuery<Result, Query>(
    cache,
    qi: QueryInput,
    result: any,
    fn: (r: Result, q: Query) => Query
  ) {
    return cache.updateQuery(qi, data => fn(result, data as any) as any);
}
  
export default betterUpdateQuery;
import { dedupExchange, Exchange, fetchExchange, ssrExchange, stringifyVariables } from "@urql/core";
import {
  DeletePostMutationVariables,
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  VoteMutationVariables,
} from "../src/generated/graphql";
import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import betterUpdateQuery from "./betterUpdateQuery";
import {pipe, tap} from "wonka";
import Router from "next/router";
import { gql } from "urql";
import { isServer } from "./isServer";


const errorExchange: Exchange = ({ forward }) => ops$ => {
  return pipe (
    forward(ops$),
    tap(({error}) => {
      // If the operationResult has an error send a request to sentry
      if(error?.message.includes("Not Autenticated")) {
        // THe error is a CombinedError with networkError and graphqlErrors properties
        Router.replace("/login");
      }
    })
  )
}

const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    // console.log("Pagination => ",entityKey, fieldName);
    // Pagination =>  entityKey: "Query", fieldNme: "posts"
    const allFields = cache.inspectFields(entityKey);
    console.log("Allfields => ", allFields);
    // All Queries =>  [{ fieldKey: 'posts({"limit":10})', fieldName: 'posts', arguments: { limit: 10 } }]
    // Filtering the queries
    const fieldInfos = allFields.filter(info => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }
    console.log("FieldArgs: ", fieldArgs);
    // info.partial = true;
    
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    console.log("Fieldkey we created: ", fieldKey);
    // const isItInTheCache = cache.resolve(entityKey, fieldKey)
    const cachekey = cache.resolve(entityKey, fieldKey) as string;
    const isItInTheCache = cache.resolve(cachekey, "posts");
    const isItInTheCachehasMore = cache.resolve(cachekey, "hasMore");
    console.log("isItInTheCache: ", isItInTheCache, "isItInTheCachehasMore: ", isItInTheCachehasMore); // Does previous cache exists
    info.partial = !isItInTheCache; // If its not in cache then we have a partial return
    const results: string[] = [];
    let hasMore = true;
    fieldInfos.forEach(fi => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string;
      console.log("key: ", key); // Query.posts({"limit":10}) => String
      const data = cache.resolve(key, "posts") as string[];
      const _hasMore = cache.resolve(key, "hasMore");
      if(!_hasMore){
        hasMore = _hasMore as boolean;
      }
      results.push(...data);
    });
    return {
      __typename: "PaginatedPosts",
      hasMore,
      posts: results
    };
  };
};

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = "";
  if(isServer()) {
    // Cookies from browser -> Next.JS server
    // Only available on server
    console.log('ssr token: ', ctx?.req!.headers.cookie);
    cookie =  ctx?.req!.headers.cookie;
  }

  return ({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include" as const,
    headers: cookie ? {
      cookie
    } : undefined
  },
  exchanges: [
    dedupExchange,
    cacheExchange({
      keys: {
        PaginatedPosts: () => null
      },
      resolvers: {
        Query: {
          posts: cursorPagination(), // Name show match post.graphql function name
        }
      },
      updates: {
        Mutation: {
          deletePost: (result, args, cache, info) => {
            cache.invalidate({
              __typename: "Post",
              id: (args as DeletePostMutationVariables).id
            })
          },

          vote: (_result, args, cache, info) => {
            const {postId, value} = args as VoteMutationVariables;
            // Reading the fragment
            const data = cache.readFragment(
              gql`
                fragment _ on Post {
                  id
                  points
                  voteStatus
                }
              `,
              { id: postId }
            );  // Data or null
            
            if(data) {
              if(data.voteStatus === value) {
                return;
              }
              console.log("Data: ", data);
              const newPoints = parseInt(data.points) + (!data.voteStatus ? 1 : 2) * value;
              // Writing/Updating the fragment
              cache.writeFragment(
                gql`
                  fragment _ on Post {
                    points 
                    voteStatus
                  }
                `,
                { id: postId, points: newPoints, voteStatus: value }
              )
            }
          },

          createPost: (_result, args, cache, info) => {
            const allFields = cache.inspectFields("Query");
            // Where posts query runs invalidate it
            const fieldInfos = allFields.filter(
              (info) => info.fieldName === "posts"
            )
            fieldInfos.forEach(fi => {
              cache.invalidate('Query', 'posts', fi.arguments || {})
            });
          },

          logout: (_result, args, cache, info) => {
            // Me Query
            betterUpdateQuery<LogoutMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              () => ({ me: null }) // set Me to null
            );
          },
          login: (_result, args, cache, info) => {
            betterUpdateQuery<LoginMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.login.errors) {
                  return query;
                } else {
                  return {
                    me: result.login.user,
                  };
                }
              }
            );
          },
        },
      },
    }),
    errorExchange,
    ssrExchange,
    fetchExchange,
  ],
})
};

import "../styles/Home.module.css";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../util/createUrqlClient";
import Layout from "./components/Layout";
import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/layout";
import {Link} from "@chakra-ui/react";
import  NextLink from "next/link";
import { Button } from "@chakra-ui/button";
import { useState } from "react";
import { usePostsQuery } from "../src/generated/graphql";
import UpvootsSection from "./components/UpvootsSection";

function Home() {
  const [variables, setVariabes] = useState({limit: 10, cursor: null as null | string});
  
  const [{ fetching, data }] = usePostsQuery({ variables});
  // console.log("Posts: ", data.posts.posts[1]);
  
  if(data?.posts.posts.length === 0) {
    return <h1> No Posts </h1>
  }
  return (
    <Layout>
      <br />
      {fetching && !data ? (
        <div>Loading...</div>
      ) : (
        <Stack spacing={8}>
          {data?.posts.posts.map((p) => (
            <Flex key={p.id} p={5} shadow="md" borderWidth="1px">
              <UpvootsSection post={p} />
              <Box>
                <NextLink href="/post/[id]" as={`/post/${p.id}`}>
                  <Link>
                    <Heading fontSize="xl">{p.title}</Heading>
                  </Link>
                </NextLink>
                <Text>Posted By {p.creator.username}</Text>
                <Text mt={4}>{p.textSnippet}</Text>
              </Box>
            </Flex>
          ))}
        </Stack>
      )}
      {data && data.posts.hasMore ? (
        <Flex>
          <Button m='auto' onClick={() => {
            setVariabes({
              limit: variables.limit,
              cursor: data.posts.posts[data?.posts.posts.length - 1].createdAt
            })
          }} isLoading={fetching} my={4}>
            Load More
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
}

// export default withUrqlClient(createUrqlClient)(Home) // Not SSR
export default withUrqlClient(createUrqlClient, { ssr: true })(Home);

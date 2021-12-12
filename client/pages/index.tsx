import "../styles/Home.module.css";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../util/createUrqlClient";
import Layout from "./components/Layout";
import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/layout";
import { CloseButton, IconButton, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { Button } from "@chakra-ui/button";
import { useState } from "react";
import { useDeletePostMutation, usePostsQuery } from "../src/generated/graphql";
import UpvootsSection from "./components/UpvootsSection";
import { DeleteIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";

function Home() {
  const [variables, setVariabes] = useState({
    limit: 10,
    cursor: null as null | string,
  });

  const [{ fetching, data }] = usePostsQuery({ variables });
  // console.log("Posts: ", data);
  const [, deletePost] = useDeletePostMutation();
  async function deleteOnePost(id) {
    let deletedResponse = await deletePost({ id });
    console.log("DeletedResponse: ", deletedResponse);
    if (deletedResponse.data.deletePost) {
      return (
        <Alert status="success">
          <AlertIcon />
          <AlertTitle mr={2}>Your browser is outdated!</AlertTitle>
          <AlertDescription>
            Your Chakra experience may be degraded.
          </AlertDescription>
          <CloseButton position="absolute" right="8px" top="8px" />
        </Alert>
      );
    }
  }
  if (data?.posts.posts.length === 0) {
    return <h1> No Posts </h1>;
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
              <Box flex={1}>
                <NextLink href="/post/[id]" as={`/post/${p.id}`}>
                  <Link>
                    <Heading fontSize="xl">{p.title}</Heading>
                  </Link>
                </NextLink>
                <Text>Posted By {p.creator.username}</Text>
                <Text mt={4}>{p.textSnippet}</Text>
                <Flex>
                  <IconButton
                    ml="auto"
                    icon={<DeleteIcon />}
                    variant={"transparent"}
                    color="red"
                    fontSize="18px"
                    aria-label="Delete Post"
                    onClick={() => {
                      deleteOnePost(p.id);
                    }}
                  />
                </Flex>
              </Box>
            </Flex>
          ))}
        </Stack>
      )}
      {data && data.posts.hasMore ? (
        <Flex>
          <Button
            m="auto"
            onClick={() => {
              setVariabes({
                limit: variables.limit,
                cursor:
                  data.posts.posts[data?.posts.posts.length - 1].createdAt,
              });
            }}
            isLoading={fetching}
            my={4}
          >
            Load More
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
}

// export default withUrqlClient(createUrqlClient)(Home) // Not SSR
export default withUrqlClient(createUrqlClient, { ssr: true })(Home);

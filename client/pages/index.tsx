import "../styles/Home.module.css";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../util/createUrqlClient";
import Layout from "./components/Layout";
import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/layout";
import { CloseButton, IconButton, Link, useToast } from "@chakra-ui/react";
import NextLink from "next/link";
import { Button } from "@chakra-ui/button";
import { useEffect, useState } from "react";
import { useDeletePostMutation, useMeQuery, usePostsQuery } from "../src/generated/graphql";
import UpvootsSection from "./components/UpvootsSection";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons";

function Home() {
  const [variables, setVariabes] = useState({
    limit: 10,
    cursor: null as null | string,
  });
  const [{data: meData}] = useMeQuery();
  const [{ fetching, data }] = usePostsQuery({ variables });
  // console.log("Posts: ", data);
  const [, deletePost] = useDeletePostMutation();
  const [showAlert, setShowAlert] = useState(false);
  const toast = useToast();  
  async function deleteOnePost(id) {
    let deletedResponse = await deletePost({ id });
    // console.log("DeletedResponse: ", deletedResponse);
    if (deletedResponse.data.deletePost) {
      // setShowAlert(true);
      toast({
        title: "Success",
        status: "success",
        description: "Post deleted Successfully!",
        variant: "subtle",
        isClosable: true,
      });
    } else if (deletedResponse.error) {
      toast({
        title: "error",
        status: "error",
        description: "Something went wrong",
        variant: "subtle",
        isClosable: true,
      });
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
          {data?.posts.posts.map((p) =>
            !p ? null : (
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
                    { meData?.me?.id !== p.creator.id ? null : <Box ml="auto">
                      <NextLink href={"/post/edit/[id]"} as={`/post/edit/${p.id}`}>
                        <IconButton
                          as={Link}
                          ml="auto"
                          icon={<EditIcon />}
                          variant={"transparent"}
                          fontSize="18px"
                          aria-label="Edit Post"
                          onClick={() => {}}
                        />
                      </NextLink>
                      <IconButton
                        ml="auto"
                        icon={<DeleteIcon />}
                        variant={"transparent"}
                        fontSize="18px"
                        aria-label="Delete Post"
                        onClick={() => {
                          deleteOnePost(p.id);
                        }}
                      />
                    </Box> }
                  </Flex>
                </Box>
              </Flex>
            )
          )}
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

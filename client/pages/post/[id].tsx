import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import { usePostQuery } from "../../src/generated/graphql";
import { createUrqlClient } from "../../util/createUrqlClient";
import Layout from "../components/Layout";
import { Box, Heading } from "@chakra-ui/react";

const Post = ({}) => {
  const router = useRouter();
  const intId =
    typeof router.query.id === "string" ? parseInt(router.query.id) : -1;
  const [{ data, error, fetching }] = usePostQuery({
    pause: intId === -1, // Pause when intId = -1 (No post has id = -1)
    variables: {
      id: intId,
    },
  });

  if (error) {
    console.log(error.message);
    return <div>{error.message}</div>;
  }
// Hi
  if (fetching) {
    return <Layout>Loading...</Layout>;
  }

  if(!data?.post) {
    return (
      <Box>
        <Heading>Post Doesn't Exists💀</Heading>
      </Box>
    )
  }

  return (
    <Layout>
      <Heading>{data.post.title}</Heading>
      <Box>{data?.post.text}</Box>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);

import { Box, Flex, Link, Heading } from "@chakra-ui/layout";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../../src/generated/graphql";
import { Button } from "@chakra-ui/button";
import { isServer } from "../../util/isServer";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../../util/createUrqlClient";
import { useRouter } from "next/router";

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = ({}) => {
  const router = useRouter();

  const [{fetching: logoutFetching}, logout] = useLogoutMutation();
  
  const [{data, fetching}] = useMeQuery({
    pause: isServer()
  });

  const logoutUser = async () => {
    let res = await logout();
    if(res.data.logout) {
      // console.log(res, router);
      if(router.pathname === '/create-post'){
        router.replace("/login?next="+router.pathname);
      }else {
        router.replace("/login");
      }
      // if(typeof router.query.next === 'string'){
      //   router.push(router.query.next);
      // } else {
      //   router.push("/");
      // }
    }
  }

  // console.log("Data => ", data, fetching);

  let body = null;
  // console.log("Data from client: ", data);
  if(fetching) {
    body = null; // No changes
  }else if(!data?.me && !fetching){
// User Not LoggedIn
    body = (
      <>
        <NextLink href="/login">
          <Link mr={2} color="white">Login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link color="white">Register</Link>
        </NextLink>
      </>
    )
  }else {
    // User Logged In
    body = (
      <Flex align="center">
        <NextLink href="/create-post">
          <Button color="white" as={Link} mr={4}>
            <Link>Create Post</Link>
          </Button>
        </NextLink>
        <Box mr={2}>{data?.me.username}</Box>
        <Button variant="link" onClick={() => { logoutUser(); }} isLoading={logoutFetching} >Logout</Button>
      </Flex>
    )
  }
  // console.log("IsLoggedIn: ", data?.me);
  return (
    <Flex zIndex={10} position="sticky" top={0} bg="tomato" p={4}>
      <Flex flex={1} maxW={800} m={"auto"} align="center">
      <NextLink href="/">
        <Link>
          <Heading>LiReddit</Heading>
        </Link>
      </NextLink>
      <Box ml={"auto"}>{body}</Box>
      </Flex>
    </Flex>
  );
};

export default withUrqlClient(createUrqlClient)(Navbar);

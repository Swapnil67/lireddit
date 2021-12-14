import { Box, Button, Flex, Heading, useToast } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import React, { useEffect, useState } from "react";
import { createUrqlClient } from "../../../util/createUrqlClient";
import Layout from "../../components/Layout";
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/alert';
import { useRouter } from "next/router";
import { useMeQuery, usePostQuery, useUpdatePostMutation } from "../../../src/generated/graphql";
import { InputField, TextareaField } from "../../components/InputField";
import { toErrorMap } from "../../../util/toErrorMap";


const EditPost = ({}) => {
  const router = useRouter();
  const [, updatePost] = useUpdatePostMutation();

  const [{data, fetching}] = useMeQuery();
  const toast = useToast();
  const intId =
    typeof router.query.id === "string" ? parseInt(router.query.id) : -1;

  const [{data: pData, error, fetching: pfetching}] = usePostQuery({
    pause: intId === -1, // Pause when intId = -1 (No post has id = -1)
    variables: {id: intId}
  })
  const [userLoggedIn, setUserLoggedIn] = useState(true);
  useEffect(() => {
    if(!fetching && !data?.me) {
      setUserLoggedIn(false);
      console.log("You are not logged In");
    }
  }, [fetching, data, router])
  if (fetching) {
    return <Layout>Loading...</Layout>;
  }
  if (error) {
    console.log(error.message);
    return <div>{error.message}</div>;
  }
  if(!pData?.post) {
    return (
      <Box>
        <Heading>Post Doesn't Exists💀</Heading>
      </Box>
    )
  }
  return (
    <Layout variant="regular">
    <Formik
      initialValues={{ title: pData.post.title, text: pData.post.text }}
      onSubmit={async (values, { setErrors }) => {
        console.log(values);
        const response = await updatePost({
          updatePostId: intId,
          ...values
        })
        console.log("Update Post Response => ", response);
        if (response.data?.updatePost.errors) {
          // ? => Optional Chaining In TS
          setErrors(toErrorMap(response.data.updatePost.errors));
        } else if (!response.data.updatePost.errors && response.data.updatePost.id) {
          toast({
            title: "Success",
            status: "success",
            description: "Post Updated Successfully!",
            variant: "subtle",
            isClosable: true,
          });
          router.push("/");
        }
      }}
    >
      {({ isSubmitting }) => (
        <>
        {!userLoggedIn ? 
          <Alert status='error' variant='subtle' flexDirection='column' alignItems='center' justifyContent='center' textAlign='center' height='200px'>
            <AlertIcon boxSize='40px' mr={0} />
            <AlertTitle mt={4} mb={1} fontSize='lg'>
              Authentication Error
            </AlertTitle>
            <AlertDescription maxWidth='sm'>
              You are not loggedIn to edit post please login.
            <Button onClick={() => router.replace("/login?next="+router.asPath)} mt={4} ml="auto" colorScheme="teal">
              Login
            </Button>
            </AlertDescription>
          </Alert> : 
          <Form>
            <InputField name="title" placeholder="Title" label="Title"/>
            <Box mt={4}>
              <TextareaField name="text" placeholder="text..." label="Body"/>
            </Box>
            <Flex>
              <Button mt={4} type="submit" isLoading={isSubmitting} colorScheme="teal">
                Update Post
              </Button>
            </Flex>
          </Form>
        }
        </>
      )}
    </Formik>
  </Layout>
  )
}

export default withUrqlClient(createUrqlClient)(EditPost);
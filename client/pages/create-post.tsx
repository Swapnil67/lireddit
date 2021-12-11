import { Button } from '@chakra-ui/button';
import { Box, Flex } from '@chakra-ui/layout';
import { Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { toErrorMap } from '../util/toErrorMap';
import { InputField, TextareaField } from './components/InputField';
import { useRouter } from 'next/router';
import { useCreatePostMutation, useMeQuery } from '../src/generated/graphql';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../util/createUrqlClient';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/alert';
import Layout from './components/Layout';


const CreatePost: React.FC<{}> = ({}) => {
  const router = useRouter();
  const [{data, fetching}] = useMeQuery();
  const [userLoggedIn, setUserLoggedIn] = useState(true);
  useEffect(() => {
    if(!fetching && !data?.me) {
      setUserLoggedIn(false);
      console.log("You are not logged In");
    }
  }, [fetching, data, router])
  // let isLoggedIn = useIsAuth();
  // console.log("isLoggedIn: ", isLoggedIn);
  
  const [, createPost] = useCreatePostMutation()
  return  (
    <Layout variant="regular">
      <Formik
        initialValues={{ title: "", text: "" }}
        onSubmit={async (values, { setErrors }) => {
          console.log(values);
          const response = await createPost({input: values});
          console.log("Response => ", response);
          if (response.data?.createPost.errors) {
            // ? => Optional Chaining In TS
            setErrors(toErrorMap(response.data.createPost.errors));
          } else if (response.data.createPost.post) {
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
                You are not loggedIn to create post please login.
              <Button onClick={() => router.replace("/login?next="+router.pathname)} mt={4} ml="auto" colorScheme="teal">
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
                  Add Post
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

export default withUrqlClient(createUrqlClient)(CreatePost);
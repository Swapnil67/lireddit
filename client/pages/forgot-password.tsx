import { Formik, Form } from "formik";
import { Button, Alert, AlertIcon, AlertTitle, AlertDescription, Link, Box, Flex } from "@chakra-ui/react";
import React, { useState } from "react";
import { Wrapper } from "./components/wraper";
import { InputField } from "./components/InputField";
import { useForgotPasswordMutation } from "../src/generated/graphql";
import { useRouter } from "next/dist/client/router";
import { toErrorMap } from "../util/toErrorMap";
import { createUrqlClient } from "../util/createUrqlClient";
import { withUrqlClient } from "next-urql";
import NextLink from 'next/link'

const forgotPassword: React.FC<{}> = ({}) => {
  const [, forgotPassword] = useForgotPasswordMutation();
  const [complete, setComplete] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  return (
    <Wrapper>
      <Formik
        initialValues={{ email: "" }}
        onSubmit={async (values, { setErrors }) => {
          console.log(values);
          const response = await forgotPassword(values);
          console.log("Response => ", response);
          if (response.data?.forgotPassword.errors) {
            setErrors(toErrorMap(response.data.forgotPassword.errors));
          } else if (response.data.forgotPassword.res) {
            // Show the Success Alert
            setComplete(true);
            setSuccessMessage(response.data.forgotPassword.msg)
            // router.push("/");
          } 
        }}
      >
        {({ isSubmitting }) => (
          complete ? (
            <Box>
              <Alert status='success' variant='subtle' flexDirection='column' alignItems='center' justifyContent='center' textAlign='center' height='200px'>
                <AlertIcon boxSize='40px' mr={0} />
                <AlertTitle mt={4} mb={1} fontSize='lg'> Forgot Password </AlertTitle>
                <AlertDescription maxWidth='sm'>{successMessage}</AlertDescription>
              </Alert>
            </Box>
          ) :
          <Form>
            <InputField name="email" placeholder="Email" label="Email"/>
            <Flex>
              <Button mt={4} type="submit" isLoading={isSubmitting} colorScheme="teal">
                Forgot Password 
              </Button>
              <Button mt={4} ml="auto" colorScheme="teal">
               <NextLink  href="/forgot-password">
                 <Link>Login</Link>
               </NextLink>
              </Button>
            </Flex>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(forgotPassword);

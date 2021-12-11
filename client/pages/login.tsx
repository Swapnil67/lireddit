import { Formik, Form } from "formik";
import { Button, Link, Box, Flex } from "@chakra-ui/react";
import React from "react";
import { Wrapper } from "./components/wraper";
import { InputField } from "./components/InputField";
import { useLoginMutation } from "../src/generated/graphql";
import { useRouter } from "next/dist/client/router";
import { toErrorMap } from "../util/toErrorMap";
import { createUrqlClient } from "../util/createUrqlClient";
import { withUrqlClient } from "next-urql";
import NextLink from 'next/link'
interface LoginProps {}

const Login: React.FC<LoginProps> = ({}) => {
  const [, login] = useLoginMutation();
  const router = useRouter();
  
  return (
    <Wrapper>
      <Formik
        initialValues={{ usernameOrEmail: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          console.log(values);
          const response = await login(values);
          console.log("Response => ", response);
          if (response.data?.login.errors) {
            // ? => Optional Chaining In TS
            setErrors(toErrorMap(response.data.login.errors));
          } else if (response.data.login.user) {
            if(typeof router.query.next === 'string'){
              router.push(router.query.next);
            } else {
              router.push("/");
            }
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="usernameOrEmail" placeholder="Username or Email" label="Username or Email"/>
            <Box mt={4}>
              <InputField name="password" placeholder="Password" label="Password" type="password"/>
            </Box>
            <Flex>
              <Button mt={4} type="submit" isLoading={isSubmitting} colorScheme="teal">
                Login
              </Button>
              <Button mt={4} ml="auto" colorScheme="teal">
               <NextLink  href="/forgot-password">
                 <Link> Forgot Password </Link>
               </NextLink>
              </Button>
            </Flex>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Login);

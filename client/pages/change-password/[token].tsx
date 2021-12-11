import { Button } from "@chakra-ui/button";
import { Box, Link } from "@chakra-ui/layout";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import React, { useState } from "react";
import { toErrorMap } from "../../util/toErrorMap";
import { InputField } from "../components/InputField";
import { Wrapper } from "../components/wraper";
import NextLink from "next/link";
import { useUpdatePasswordMutation } from "../../src/generated/graphql";
import { useRouter } from "next/dist/client/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../../util/createUrqlClient";
import { Alert, AlertIcon } from "@chakra-ui/alert";

const ChangePassword: NextPage<{ token: string }> = ({ token }) => {
  const [, updatePassword] = useUpdatePasswordMutation();
  const [tokenError, setTokenError] = useState('');
  const router = useRouter();

  return (
    <Wrapper>
    <Formik
      initialValues={{ newPassword: "" }}
      onSubmit={async (values, { setErrors }) => {
        console.log(values);
        const response = await updatePassword({newPassword: values.newPassword, token});
        console.log("Response => ", response);
        if (response.data?.updatePassword.errors) { // ? => Optional Chaining In TS
          setErrors(toErrorMap(response.data.updatePassword.errors));
          const errorMap = toErrorMap(response.data.updatePassword.errors);
          if('token' in errorMap) {
            setTokenError(errorMap.token);
          }
          setErrors(errorMap);
        } else if (response.data.updatePassword.user) {
          router.push("/login");
        }
      }}
    >
      {({isSubmitting }) => (
        <Form>
          <Box mt={4}>
            <InputField name="newPassword" placeholder="New Password" label="New Password" type="password"/>
          </Box>
          {  
            tokenError ?
            <Alert mt={2} status='error'>
              <AlertIcon />
              {tokenError}
              <NextLink href="/forgot-password">
                <Link ml="auto">Go forgot it again</Link>
              </NextLink>
            </Alert>
            :
            null
          }
          <Button mt={4} type="submit" isLoading={isSubmitting} colorScheme="teal">Update Password</Button>
        </Form>
      )}
    </Formik>
  </Wrapper>
  )
};

ChangePassword.getInitialProps = ({ query }) => {
  return {
    token: query.token as string,
  };
};


export default withUrqlClient(createUrqlClient)(ChangePassword)

// Preview URL: https://ethereal.email/message/YTJYXQfBwKRpTX7UYaidcKtKdgim.9V5AAAACdKNr0G-W75E6rwXeD7gTtE
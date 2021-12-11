import React from "react";
import { Form, Formik } from "formik";
import { Button, Input, Box } from "@chakra-ui/react";
import { Wrapper } from "./components/wraper";
import { InputField } from "./components/InputField";
// import { useMutation } from "urql";
import { useRegisterUserMutation } from "../src/generated/graphql";
import { toErrorMap } from "../util/toErrorMap";
import { useRouter } from "next/dist/client/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../util/createUrqlClient";

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
  // const [, register] = useMutation(REGISTER_MUT);
  const [, register] = useRegisterUserMutation();
  
  const router = useRouter();
  return (
    <Wrapper>
      <Formik
        initialValues={{ email: "", username: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          console.log(values);
          const response = await register({registerOptions: values});
          console.log("Response => ", response);

          if (response.data?.register.errors) {
            // ? => Optional Chaining In TS
            setErrors(toErrorMap(response.data.register.errors));
          } else if (response.data.register.user) {
            router.push("/login");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="username"
              placeholder="Username"
              label="Username"
            />
            <Box mt={4}>
              <InputField
                name="email"
                placeholder="Email"
                label="Email"
                type="email"
              />
            </Box>
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="Password"
                label="Password"
                type="password"
              />
            </Box>
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Register);

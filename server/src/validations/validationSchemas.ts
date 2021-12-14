import { object, string, TypeOf } from "yup";
const passwordSchema = object({
  newPassword: string()
    .required("Password is Required")
    .min(8, "Please enter password of minimum 8 characters"),
});

const emailSchema = object({
  email: string().email("Please enter valid email").required("Email is Required")
});

const usernameSchema = object({
  username: string().required("Username is Required")
});

const textSchema = object({
  text: string().required("This cannot be empty!")
});

const titleSchema = object({
  title: string().required("Title cannot be empty!")
});

export default {passwordSchema, emailSchema, usernameSchema, textSchema, titleSchema};

// export type PasswordType = TypeOf<typeof schema>;

// Or We can also use interface
// interface PasswordInterface extends TypeOf<typeof schema> {};

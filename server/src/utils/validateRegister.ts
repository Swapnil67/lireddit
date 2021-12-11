import { UsernamePasswordInput } from "../resolvers/UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
  if (!options.email.includes("@")) {
    return [
        {
          field: "email",
          message: "Please Enter valid Email",
        },
      ]
  }
  if (options.username.length < 2) {
    return [
        {
          field: "username",
          message: "Length Must be greater than 2",
        },
      ]
  }
  if (options.username.includes("@")) {
    return  [
        {
          field: "username",
          message: "Cannot include @",
        },
      ]
  }
  if (options.password.length < 8) {
    return  [
        {
          field: "password",
          message: "Password Length Must be greater than 8",
        },
      ]
  }
  return null;
};

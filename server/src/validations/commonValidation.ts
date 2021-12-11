import { Field, ObjectType } from "type-graphql";
import argon2 from "argon2";
import { User } from "../entities/User";

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class validateResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User)
  user?: User
}


// Is valid Password From Database
const isValidPassword = async (hashedPassword: string, password: string): Promise<validateResponse> => {
  const result = await argon2.verify(hashedPassword, password);
  if(!result) {
    return {
      errors: [
        {
          field: "password",
          message: "Invalid Details",
        }
      ],
    }
  }
  return {
    errors: undefined
  }
}

// Is valid Username from database
const isValidUsername = async (Inpfield: string, fieldValue: string): Promise<validateResponse> => {
  const user = await User.findOne({where: {username: fieldValue}});
  if(!user) {
    return {
      errors: [
        {
          field: Inpfield,
          message: "Invalid Details",
        }
      ],
    }
  }
  return {
    user
  }
}

// Is valid Email From Database
const isValidEmail = async (Inpfield: string, fieldValue: string): Promise<validateResponse> => {
  const user = await User.findOne({where: {email: fieldValue}});
  if(!user) {
    return {
      errors: [
        {
          field: Inpfield,
          message: "Invalid Details",
        }
      ],
    }
  }
  return {
    user
  }
}



export default {isValidPassword, isValidUsername, isValidEmail};
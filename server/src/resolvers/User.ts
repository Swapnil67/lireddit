import argon2 from "argon2";
import * as jwt from "jsonwebtoken";
import { sign } from "jsonwebtoken";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import { COOKIE_NAME, JWT_SECRET } from "../constants";
import { User } from "../entities/User";
import { MyContext } from "../types";
import { sendEmail } from "../utils/sendEmail";
import { validateRegister } from "../utils/validateRegister";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import schema from "../validations/validationSchemas";
import verifyJWT from "../utils/verifyJWT_token";
import { getConnection } from "typeorm";
import validateField from "../validations/validate";
import commonValidation from "../validations/commonValidation";
import FieldError from "../ObjectTypes/fieldError";
import { Post } from "src/entities/Post";
import getUserFromToken from "../utils/getUserfromToken";

// @ObjectType()
// class FieldError {
//   @Field()
//   field: string;
//   @Field()
//   message: string;
// }

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, {nullable: true})
  user?: User;
}

@ObjectType()
class UserForgotPasswordResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => Boolean, { nullable: true })
  res?: boolean;
  @Field(() => String, { nullable: true })
  msg?: string;
}

@Resolver(User)
export class UserResolver {

  // TODO
  // @FieldResolver(() => String) 
  // async email(@Root() user: User, @Ctx() {req}: MyContext) {
  //   // This is the current user and it's okay to show them there own email
  //   let isUser = getUserFromToken(req)

  //   isUser.then((doc) => {
  //     console.log(doc);
  //     console.log("Worked");
  //     return user.email
  //   }).catch((err) => {
  //     // console.log("Worked No it didn't");
  //     return ""
  //   })
    // console.log('User => ', isUser);
    // Current user wants to see someone else's email
    // return ""
    // if(!isUser) return ""
    // return user.email
  //   return ""
  // }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext):Promise<User> {
    let token = req?.headers?.cookie?.split("=")[1];
    console.log("Token from me: ", token);
    let user = null;
    if (token) {
      const { sub }: any = jwt.verify(token, "keep_it_secret");
      user = await User.findOne(sub);
    } else if (req?.headers?.authorization) {
      let token = req?.headers?.authorization;
      const { sub }: any = jwt.verify(token, "keep_it_secret");
      user = await User.findOne(sub);
    }
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }
    let user: undefined | User = undefined;
    try {
      let hashedPassword = await argon2.hash(options.password);
      user = await getConnection()
        .transaction((transactionalEntityManager): Promise<User> => {
          const userObj = User.create({
            username: options.username,
            email: options.email,
            password: hashedPassword,
            forgotPassToken: ""
          });
          return transactionalEntityManager.save(User, userObj);
        })
      console.log(user);
    } catch (error) {
      console.log("=> ", error);
      if ((error.code = "23505" && error.detail.includes("already exists"))) {
        return {
          errors: [
            {
              field: "username",
              message: "User Already Exists",
            },
          ],
        };
      }
    }
    return {
      user
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { res }: MyContext
  ): Promise<UserResponse> {
    const whichSchema = usernameOrEmail.includes("@") ? schema.emailSchema : schema.usernameSchema;
    let whichField = usernameOrEmail.includes("@") ? {"email": usernameOrEmail} : {"username": usernameOrEmail};
    const error = await validateField(whichField, usernameOrEmail, whichSchema, "usernameOrEmail")
    console.log("=> ", error);
    if(error.errors) {
      return error;
    }
    
    let user: User | undefined = undefined;
    if(usernameOrEmail.includes("@")) {
      const isValidEmailDB = await commonValidation.isValidEmail("usernameOrEmail", usernameOrEmail)
      if(isValidEmailDB.errors) {
        console.log("Email => ", isValidEmailDB);
        return isValidEmailDB;
      }
      user = isValidEmailDB.user;
    }else {
      const isValidUsernameDB = await commonValidation.isValidUsername("usernameOrEmail", usernameOrEmail)
      if(isValidUsernameDB.errors) {
        console.log("Username => ", isValidUsernameDB);
        return isValidUsernameDB;
      }
      user = isValidUsernameDB.user;
    }

    const isValidPasswordDB = await commonValidation.isValidPassword(user!.password, password);
    if(isValidPasswordDB.errors) {
      console.log("Password => ", isValidPasswordDB);
      return isValidPasswordDB;
    }
    const token = sign({ sub: user!.id }, "keep_it_secret");
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // and won't be usable outside of my domain
      maxAge: 1000 * 60 * 60 * 24, //10 years
    });
    res.setHeader("Authorization", `Bearer ${token}`);
    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: MyContext) {
    console.log("Logged Out");
    res.clearCookie(COOKIE_NAME);
    return true;
  }

  @Mutation(() => UserForgotPasswordResponse)
  async forgotPassword(
    @Arg("email") email: string
  ): Promise<UserForgotPasswordResponse> {
    try {
      await schema.emailSchema.validate({ email });
    } catch (error) {
      return {
        errors: [
          {
            field: error.path,
            message: error.errors[0],
          },
        ],
      };
    }
    const user = await User.findOne({ where: { email } });
    if (!user)
      return {
        res: true,
        msg: "If any account with that Email Exists, Reset password link has been sent on your given email.",
      }; // No User Exists with that Email
    const tokenSetDate = new Date();
    const tokenExpiresTimeStamp = tokenSetDate.setDate(
      tokenSetDate.getDate() + 3
    ); // expires in 3 days
    const tokenExpiresDate = new Date(tokenExpiresTimeStamp);
    const token = sign({ sub: user.id, expires: tokenExpiresDate }, JWT_SECRET);
    await User.update({ email }, { forgotPassToken: token });
    const changePasshtml = `<a href="http://localhost:3000/change-password/${token}">Reset Password</a>`;
    await sendEmail(email, changePasshtml);
    return {
      res: true,
      msg: "If any account with that Email Exists, Reset password link has been sent on your given email.",
    };
  }

  @Mutation(() => UserResponse)
  async updatePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string
  ): Promise<UserResponse> {
    try {
      await schema.passwordSchema.validate({ newPassword });
    } catch (error) {
      return {
        errors: [
          {
            field: error.path,
            message: error.errors[0],
          },
        ],
      };
    }

    const decoded: any = verifyJWT(token);
    const userIdNum = Number(decoded?.sub);
    const tokenExpired = new Date(decoded?.expires);
    const today = new Date();
    // var dummyDate = new Date();
    // dummyDate.setDate(dummyDate.getDate() + 10);
    if (today > tokenExpired) {
      return {
        errors: [
          {
            field: "token",
            message: "Token Expired",
          },
        ],
      };
    }
    const user = await User.findOne({ id: userIdNum });
    if (user?.forgotPassToken !== token) {
      return {
        errors: [
          {
            field: "token",
            message: "Token Expired",
          },
        ],
      };
    }
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "User No longer exists",
          },
        ],
      };
    }
    const hashedPassword = await argon2.hash(newPassword);
    const UpdatedforgotPassToken = "Your token is now Expired";
    User.update(
      { id: userIdNum },
      { password: hashedPassword, forgotPassToken: UpdatedforgotPassToken }
    );
    return {
      user,
    };
  }

  @Query(() => User, {nullable: true})
  async getAllUsers(): Promise<User[] | null> {
    const users = await User.find({});
    console.log(users);
    
    return users;
  }

}

/*
// import argon2 from "argon2";
// import * as jwt from "jsonwebtoken";
// import { sign } from "jsonwebtoken";
// import {
//   Arg,
//   Ctx,
//   Field, Mutation,
//   ObjectType,
//   Query,
//   Resolver
// } from "type-graphql";
// import { COOKIE_NAME, JWT_SECRET } from "../constants";
// import { User } from "../entities/User";
// import { MyContext } from "../types";
// import { sendEmail } from "../utils/sendEmail";
// import { validateRegister } from "../utils/validateRegister";
// import { UsernamePasswordInput } from "./UsernamePasswordInput";
// import schema from "../validations/password";
// import verifyJWT from "../utils/verifyJWT_token";

// @ObjectType()
// class FieldError {
//   @Field()
//   field: string;
//   @Field()
//   message: string;
// }

// @ObjectType()
// class UserResponse {
//   @Field(() => [FieldError], { nullable: true })
//   errors?: FieldError[];

//   @Field(() => User, { nullable: true })
//   user?: User;
// }

// @ObjectType()
// class UserForgotPasswordResponse {
//   @Field(() => [FieldError], { nullable: true })
//   errors?: FieldError[];
//   @Field(() => Boolean, { nullable: true })
//   res?: boolean;
//   @Field(() => String, { nullable: true })
//   msg?: string;
// }


// @Resolver()
// export class UserResolver {
//   @Query(() => User, { nullable: true })
//   async me(@Ctx() { req, res, em, userId }: MyContext) {
//     console.log(req.headers);

//     let token = req?.headers?.cookie?.split("=")[1];
//     console.log("Token from me: ", token);
//     // console.log("Token from me: ", req);

//     let user = undefined;
//     if (token) {
//       const { sub }: any = jwt.verify(token, "keep_it_secret");
//       user = await em.findOne(User, { id: sub });
//     } else if (req?.headers?.authorization) {
//       let token = req?.headers?.authorization;
//       const { sub }: any = jwt.verify(token, "keep_it_secret");
//       user = await em.findOne(User, { id: sub });
//     }
//     return user;
//   }

//   @Mutation(() => UserResponse)
//   async register(
//     @Arg("options") options: UsernamePasswordInput,
//     @Ctx() { em }: MyContext
//   ): Promise<UserResponse> {
//     const errors = validateRegister(options);
//     if(errors) {
//       return {errors};
//     }
//     const hashedPassword = await argon2.hash(options.password);
//     const user = em.create(User, {
//       username: options.username,
//       email: options.email,
//       password: hashedPassword,
//     });
//     try {
//       await em.persistAndFlush(user);
//     } catch (error) {
//       console.log(error);
//       if ((error.code = "23505" && error.detail.includes("already exists"))) {
//         return {
//           errors: [
//             {
//               field: "username",
//               message: "User Already Exists",
//             },
//           ],
//         };
//       }
//     }
//     return {
//       user,
//     };
//   }

//   @Mutation(() => UserResponse)
//   async login(
//     @Arg("usernameOrEmail") usernameOrEmail: string,
//     @Arg("password") password: string,
//     @Ctx() { em, req, res }: MyContext
//   ): Promise<UserResponse> {
//     const user = await em.findOne(User,
//       usernameOrEmail.includes("@") ?
//       {email: usernameOrEmail}
//       : { username: usernameOrEmail.toLowerCase() });
//     if (!user) {
//       return {
//         errors: [
//           {
//             field: "usernameOrEmail",
//             message: "Invalid Details",
//           },
//         ],
//       };
//     }
//     const isValidPassword = await argon2.verify(
//       user.password,
//       password
//     );
//     if (!isValidPassword) {
//       return {
//         errors: [
//           {
//             field: "password",
//             message: "Invalid Details",
//           },
//         ],
//       };
//     }
//     await em.persistAndFlush(user);
//     const token = sign({ sub: user.id }, "keep_it_secret");
//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: false, // and won't be usable outside of my domain
//       maxAge: 1000 * 60 * 60 * 24, //10 years
//     });
//     res.setHeader("Authorization", `Bearer ${token}`);
//     console.log("=> Token: ", token);
//     return {
//       user,
//     };
//   }

//   @Mutation(() => Boolean)
//   async logout(
//     @Ctx() {res, req}: MyContext
//   ) {
//     console.log("Logged Out");
//     res.clearCookie(COOKIE_NAME);
//     return true;
//   }

//   @Mutation(() => UserForgotPasswordResponse) 
//   async forgotPassword(
//     @Arg('email') email: string,
//     @Ctx() {em, req}: MyContext
//   ): Promise<UserForgotPasswordResponse> {
//     try {
//       await schema.emailSchema.validate({email})
//     } catch (error) {
//       return {
//         errors: [{
//           field: error.path,
//           message: error.errors[0]
//         }]
//       }
//     }
//     const user = await em.findOne(User, {email});
//     if(!user) return {res: true, msg: "If any account with that Email Exists, Reset password link has been sent on your given email."};
//     ; // No User Exists with that Email
//     const tokenSetDate = new Date();
//     const tokenExpiresTimeStamp = tokenSetDate.setDate(tokenSetDate.getDate() + 3); // expires in 3 days
//     const tokenExpiresDate = new Date(tokenExpiresTimeStamp)
//     const token = sign({ sub: user.id, expires:  tokenExpiresDate}, JWT_SECRET)
//     user.forgotPassToken = token;
//     await em.flush();
//     const changePass = `<a href="http://localhost:3000/change-password/${token}">Reset Password</a>`
//     await sendEmail(email, changePass);
//     return {res: true, msg: "If any account with that Email Exists, Reset password link has been sent on your given email."};
//   }

//   @Mutation(() => UserResponse)
//   async updatePassword(
//     @Arg('token') token: string,
//     @Arg("newPassword") newPassword: string,
//     @Ctx() {em, req}: MyContext
//   ): Promise<UserResponse> {
//     try {
//       await schema.passwordSchema.validate({newPassword})
//     } catch (error) {
//       return {
//         errors: [{
//           field: error.path,
//           message: error.errors[0]
//         }]
//       }
//     }

//     const decoded: any = verifyJWT(token);
//     console.log(token, decoded);
    
//     const userIdNum = Number(decoded?.sub)
//     const tokenExpired = new Date (decoded?.expires)
//     const today = new Date();
//     // var dummyDate = new Date();
//     // dummyDate.setDate(dummyDate.getDate() + 10);
//     if(today > tokenExpired) {
//       return {
//         errors: [{
//           field: "token",
//           message: "Token Expired"
//         }]
//       }
//     } 
//     const user = await em.findOne(User, {id: userIdNum});
//     if(user?.forgotPassToken !== token) {
//       return {
//         errors: [{
//           field: "token",
//           message: "Token Expired"
//         }]
//       }
//     }
//     if(!user) {
//       return {
//         errors: [{
//           field: "token",
//           message: "User No longer exists"
//         }]
//       }
//     }
//     user.password = await argon2.hash(newPassword);
//     user.forgotPassToken = "Your token is now Expired";
//     await em.persistAndFlush(user);
//     return {
//       user
//     };
//   }
// }

*/

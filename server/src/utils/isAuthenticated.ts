import { MyContext } from "../types";
import { MiddlewareFn } from "type-graphql";

const isAuth: MiddlewareFn<MyContext> = async ({context}, next) => {
  let token = context.req?.headers?.cookie?.split("=")[1];
  
  if(!token){
    throw new Error("Not Autenticated");
  }
  return next();
}

export default isAuth;
import { User } from "../entities/User";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "../constants";

const getUserFromToken = async (req: any): Promise<User> => {
  let user;
  let token = req?.headers?.cookie?.split("=")[1];
  console.log(req.headers.cookie);
  console.log("am I working");
  
  
  if(token) {
    const { sub }: any = jwt.verify(token, JWT_SECRET);
    try {    
      user = await User.findOne(sub);
    } catch (error) {
      throw new Error("Not Autenticated");
    }
  } else {
    throw new Error("Not Autenticated");
  }
  return user;
}

export default getUserFromToken;
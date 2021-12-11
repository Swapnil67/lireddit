import { Request, Response } from "express";

const jwt = require('jsonwebtoken');
const APP_SECRET = "keep_it_secret";

function getTokenPayload(token: string) {
  return jwt.verify(token, APP_SECRET);
}

export function getUserId(req: Request, res: Response) {
  if (req) {
    // console.log("From SetToken: ", req.headers);
    const authHeader = req.headers.cookie;
    // console.log("Auth Header: ", authHeader);
    if (authHeader) {
      // const token = authHeader.replace('Bearer ', '');
      let token = req?.headers?.cookie?.split('=')[1]
      // console.log("Auth token: ", token);
      if (!token) {
        throw new Error('No token found');
      }
      // res.setHeader('Authorization', `Bearer ${token}`)
      const { sub } = getTokenPayload(token);
      return sub;
    } 
  }

  throw new Error('from set Token Not authenticated');
}


// function setAuthToken(req: Request, res: Response) {
//   console.log("Lets set the auth token");
  
//   if(req) {
//     let token = req?.headers?.cookie?.split('=')[1]
//     // req.header
//     res.setHeader('Authorization', `Bearer ${token}`)
//   }
// }
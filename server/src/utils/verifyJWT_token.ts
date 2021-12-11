import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "../constants";

function verifyJWT(token: string) {
	const decoded = jwt.verify(token, JWT_SECRET)
	return decoded;
}

export default verifyJWT;
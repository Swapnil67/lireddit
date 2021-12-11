import { Request, Response } from "express";

export type MyContext = {
  req: Request;
  res: Response;
  userId: any;
};

// ------------------- Mikro Orm ------------------------------------------

// import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
// import { Request, Response } from "express";
// import { Session } from "inspector";
// import { User } from "./entities/User";

// export type MyContext = {
//   em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
//   req: Request;
//   res: Response;
//   userId: String;
// };


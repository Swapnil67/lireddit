import "reflect-metadata";
import express from "express";
const cors = require("cors");
import path from 'path';

import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/Post";
import { UserResolver } from "./resolvers/User";
import { __prod__ } from "./constants";
import { getUserId } from "./utils/setTokens";
import { MyContext } from "./types";
import {createConnection} from 'typeorm'
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { Upvoot } from "./entities/Upvoot";



const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    database: "lireddit",
    username: "postgres",
    password: "sanswaptill90",
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [Post, User, Upvoot]
  });

  await conn.runMigrations(); // Run the migration

  const app = express();
  app.use(
    cors({
      credentials: true,
      origin: ["http://localhost:3000", "https://studio.apollographql.com"],
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }):MyContext => ({
      req,
      res,
      userId: req && req.headers.cookie ? getUserId(req, res) : null,
    }),
  });
  // Starting the apolloServer
  await apolloServer.start();

  // Creating graphql endpoint on express
  apolloServer.applyMiddleware({ app, path: "/", cors: false });

  app.listen(4000, () => {
    console.log("Server Running on Port: 4000🔥");
  });
};

main().catch((err) => {
  console.log(err);
});

/*
// import "reflect-metadata";
// import { MikroORM } from "@mikro-orm/core";
// import express from "express";
// const cors = require("cors");
// import microConfig from "./mikro-orm.config";
// import { ApolloServer } from "apollo-server-express";
// import { buildSchema } from "type-graphql";
// import { PostResolver } from "./resolvers/Post";
// import { UserResolver } from "./resolvers/User";
// import { __prod__ } from "./constants";
// import { getUserId } from "./utils/setTokens";
// import { MyContext } from "./types";
// const main = async () => {
//   const orm = await MikroORM.init(microConfig);

//   // await orm.em.nativeDelete(User, {}); // Delete All users

//   await orm.getMigrator().up(); // Running the migrator

//   const generator = orm.getSchemaGenerator();
//   await generator.updateSchema();

//   const app = express();
//   app.use(
//     cors({
//       credentials: true,
//       origin: ["http://localhost:3000", "https://studio.apollographql.com"],
//     })
//   );

//   const apolloServer = new ApolloServer({
//     schema: await buildSchema({
//       resolvers: [PostResolver, UserResolver],
//       validate: false,
//     }),
//     context: ({ req, res }):MyContext => ({
//       em: orm.em,
//       req,
//       res,
//       userId: req && req.headers.cookie ? getUserId(req, res) : null,
//     }),
//   });
//   // Starting the apolloServer
//   await apolloServer.start();

//   // Creating graphql endpoint on express
//   apolloServer.applyMiddleware({ app, path: "/", cors: false });

//   // const post = orm.em.create(Post, { title: "My first post!" });
//   // orm.em.persistAndFlush(post);

//   app.listen(4000, () => {
//     console.log("Server Running on Port: 4000🔥");
//   });
// };

// main().catch((err) => {
//   console.log(err);
// });
*/
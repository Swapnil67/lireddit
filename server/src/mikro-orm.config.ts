// import { MikroORM } from "@mikro-orm/core";
// import path from "path";
// import { __prod__ } from "./constants";
// import { Post } from "./entities/Post";
// import { User } from "./entities/User";

// export default {
//   migrations: {
//     path: path.join(__dirname, "./migrations"),
//     pattern: /^[\w-]+\d+\.[tj]s$/,
//   },
//   type: "postgresql",
//   host: "127.0.0.1",
//   user: "postgres",
//   password: "sanswaptill90",
//   dbName: "lireddit",
//   debug: !__prod__, // Only in development mode
//   entities: [Post, User],
//   port: 5432,
// } as Parameters<typeof MikroORM.init>[0];

// // export default {
// //   type: 'postgresql',
// //   host: '127.0.0.1',
// //   user: 'postgres',
// //   password: 'sanswaptill90',
// //   dbName: 'lireddit',
// //   debug: !__prod__, // Only in development mode
// //   entities: [Post],
// //   port: 5433
// // } as const;

// // const bob = {
// //   type: 'postgresql',
// //   host: '127.0.0.1',
// //   user: 'postgres',
// //   password: 'sanswaptill90',
// //   dbName: 'lireddit',
// //   debug: !__prod__, // Only in development mode
// //   entities: [Post],
// //   port: 5433
// // } as const

// // bob.host
// // psql.exe -p 5433 -d lireddit postgres

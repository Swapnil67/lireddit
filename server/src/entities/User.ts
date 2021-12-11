// Entity is a class that maps to a database table
import { Field, Int, ObjectType } from "type-graphql";
import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, OneToMany} from "typeorm";
import { Post } from "./Post";
import { Upvoot } from "./Upvoot";

@Entity()
@ObjectType()
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column({unique: true })
  email!: string;
 
  @Field(() => String)
  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @OneToMany(() => Post, post => post.creator)
  posts: Post[];

  @OneToMany(() => Upvoot, (upvoot) => upvoot.user)
  upvoots: Upvoot[]


  @Field(() => String)
  @Column({ type: 'text', nullable: true })
  forgotPassToken!: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;
  
  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}

/*
// Entity is a class that maps to a database table
// import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
// import { Field, Int, ObjectType } from "type-graphql";

// @ObjectType()
// @Entity()
// export class User {
//   @Field(() => Int)
//   @PrimaryKey()
//   id!: Number;

//   @Field(() => String)
//   @Property({ type: "text", unique: true })
//   email!: string;
 
//   @Field(() => String)
//   @Property({ type: "text", unique: true })
//   username!: string;

//   @Property({ type: "text" })
//   password!: string;

//   @Field(() => String)
//   @Property({ nullable: true, default: null })
//   forgotPassToken!: string;

//   @Field(() => String)
//   @Property({ type: "date" })
//   createdAt = new Date();

//   @Field(() => String)
//   @Property({ type: "date", onUpdate: () => new Date() })
//   updatedAt = new Date();
// }
*/
import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

// many to many
// user <-> posts
// user -> join table <- posts
// user -> upvoot <- posts

@ObjectType()
@Entity()
export class Upvoot extends BaseEntity {

  @Field(() => Int)
  @Column({type: "int"})
  value: number;

  @Field(() => Int)
  @PrimaryColumn()
  userId: number;  

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.upvoots)
  user: User

  @Field(() => Int)
  @PrimaryColumn()
  postId: number; 

  @Field(() => Post)
  @ManyToOne(() => Post, (post) => post.upvoots, {onDelete: "CASCADE"})
  post: Post; 

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;
  
  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

}

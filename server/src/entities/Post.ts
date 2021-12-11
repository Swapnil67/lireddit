import { ObjectType, Field, Int } from "type-graphql";
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, OneToMany } from "typeorm";
import { Upvoot } from "./Upvoot";
import { User } from "./User";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: Number;
  
  @Field(() => String)
  @Column()
  title!: string;
  
  @Field(() => String)
  @Column()
  text!: string;
 
  @Field(() => String)
  @Column({type: 'int', default: 0})
  points!: number;

  @Field(() => Int, { nullable: true })
  voteStatus: number | null
  
  @Field()
  @Column()
  creatorId!: number;  

  @Field(() => User)
  @ManyToOne(() => User, user => user.posts)
  creator: User

  @OneToMany(() => Upvoot, (upvoot) => upvoot.user)
  upvoots: Upvoot[]

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;
  
  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

}

import { Post } from "../entities/Post";
import { Arg,Args,Ctx,Field,FieldResolver,InputType,Int,Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { MyContext } from "../types";
import * as jwt from "jsonwebtoken";
import { User } from "../entities/User";
import isAuth from "../utils/isAuthenticated";
import FieldError from "../ObjectTypes/fieldError";
import { JWT_SECRET } from "../constants";
import validateField from "../validations/validate";
import schema from "../validations/validationSchemas";
import { getConnection } from "typeorm";
import getUserFromToken from "../utils/getUserfromToken";
import { Upvoot } from "../entities/Upvoot";


// import sleep from "../utils/sleep";

@InputType()
class PostInput {
  @Field()
  title: string
  @Field()
  text: string
}

@ObjectType()
class PostResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => Post, {nullable: true})
  post?: Post;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field(() => Boolean)
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {

  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() {req}: MyContext
  ) {
    let user = await getUserFromToken(req)
    console.log('User => ', user);
    const isUpvoot = value !== -1; // only 1 & -1 are allowed
    const realValue = isUpvoot ? 1 : -1;

    const upvoot = await Upvoot.findOne({where: {postId, userId: user.id}});
    // User has voted on the post before and the are changing their post
    if(upvoot && upvoot.value !== realValue) {
      await getConnection().transaction(async (tm) => {
        await tm.query(`
          update upvoot
          set value = $1
          where "postId" = $2 and "userId" = $3
        `, [realValue, postId, user.id]);

        await tm.query(`
          update post
          set points = points + $1
          where id = $2;
        `, [2 * realValue, postId]);
      })
    } else if(!upvoot) {
      // dividing transactions into two parts.
      await getConnection().transaction(async (tm) => {
        await tm.query(`
          insert into upvoot ("userId", "postId", value)
          values($1, $2, $3);
        `, [user.id, postId, realValue])
        await tm.query(`
          update post
          set points = points + $1
          where id = $2;
        `, [realValue, postId]);
      })
    }
    return true;
  }




  @Query(() => PaginatedPosts) // Graphql type
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, {nullable: true}) cursor: string | null,
    @Ctx() {req, userId: userid}: MyContext
  ): Promise<PaginatedPosts> {
    // 20 -> 21
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;
    console.log(userid);
    
    const replacements: any = [realLimitPlusOne];

    if(userid) {
      replacements.push(userid)
    }

    let cursorIndex = 2;
    if(cursor) {
      replacements.push(new Date(parseInt(cursor)));
      cursorIndex = replacements.length;
    }

    // In postgres we can have multiple user table so we need to specify public.user
    const posts = await getConnection().query(`
      select p.*,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'email', u.email,
        'createdAt', u."createdAt",
        'updatedAt', u."updatedAt"
      ) creator, 
      ${
        userid
        ? '(select value from upvoot where "userId" = $2 and "postId" = p.id) "voteStatus"'
        : 'null as "voteStatus"'
      }
      from post p
      inner join public.user u on u.id = p."creatorId"
      ${cursor ? `where p."createdAt" < $${cursorIndex}` : ""}
      order by p."createdAt" DESC
      limit $1
    `, replacements)

    // console.log("Posts: ", posts[0]);
    

    // const qb =  getConnection()
    // .getRepository(Post)
    // .createQueryBuilder("p")
    // .innerJoinAndSelect(
    //   "p.creator",
    //   "creator",
    //   'creator.id = p."creatorId"'
    // )
    // .orderBy('p."createdAt"', "DESC")
    // .take(realLimitPlusOne)

    // if(cursor) {
    //   qb.where('p."createdAt" < :cursor', { cursor: new Date(parseInt(cursor))})
    // }
    // const posts = await qb.getMany();
    return {posts: posts.slice(0, realLimit), hasMore: posts.length === realLimitPlusOne}
    // return {posts, hasMore: true}
    // const posts = await Post.find({});
    // return posts;
  }

  @Query(() => Post, { nullable: true }) // Similar to type script <Post | null>
  async post(
    @Arg("id", () => Int) id: number,
  ): Promise<Post | undefined> {
    const post = await Post.findOne(id, {relations: ["creator"]});
    return post;
  }

  @Mutation(() => PostResponse)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() {req}: MyContext
  ): Promise<PostResponse> {
    let user = await getUserFromToken(req)
    console.log('User => ', user);
    
    const titleError = await validateField({"text": input.title}, input.title, schema.textSchema , "title");
    const bodyError = await validateField({"text": input.text}, input.text, schema.textSchema , "text");
    if(titleError.errors) {
      console.log("=> ", titleError);
      return titleError;
    }else if(bodyError.errors) {
      console.log("=> ", bodyError);
      return bodyError;
    }
    let post: undefined | Post = undefined;
    try {
      // post = Post.create({...input, creatorId: user!.id}).save()
      post = await getConnection()
      .transaction((transactionalEntityManager): Promise<Post> => {
        const postObj = Post.create({
          ...input,
          creatorId: user!.id
        });
        return transactionalEntityManager.save(Post, postObj);
      })
      
    } catch (error) {
      console.log("=> ", error);
      if ((error.code = "23505" && error.detail.includes("already exists"))) {
        return {
          errors: [
            {
              field: "title",
              message: "Post Already Exists",
            },
          ],
        };
      }
    }
    return {
      post
    };
  }

  @Mutation(() => Post)
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
  ): Promise<Post | null> {
    const post = await Post.findOne(id);
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      Post.update({id}, {title});
    }
    return post;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() {req, userId}: MyContext
  ): Promise<Boolean> {
    console.log("UserId: ", userId);
    
    try {
      await Post.delete({id, creatorId: userId});
    } catch (error) {
      console.log(error);
      return false;
    }
    return true;
  }
}

/*
import { Post } from "../entities/Post";
import { MyContext } from "../types";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
// import sleep from "../utils/sleep";

@Resolver()
export class PostResolver {
  @Query(() => [Post]) // Graphql type
  async posts(@Ctx() { em }: MyContext): Promise<Post[]> {
    // await sleep(3000);
    const posts = await em.find(Post, {});
    return posts;
  }

  @Query(() => Post, { nullable: true }) // Similar to type script <Post | null>
  async post(
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id });
    return post;
  }

  @Mutation(() => Post)
  async createPost(
    @Arg("title") title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post> {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);
    return post;
  }

  @Mutation(() => Post)
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      post.title = title;
      await em.persistAndFlush(post);
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<Boolean> {
    try {
      await em.nativeDelete(Post, { id });
    } catch (error) {
      console.log(error);
      return false;
    }
    return true;
  }
}
*/
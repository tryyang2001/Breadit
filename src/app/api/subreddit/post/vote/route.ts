import { PostVoteValidator } from "@/lib/validators/vote";
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "../../../../../lib/auth";
import { db } from "@/lib/db";
import { CachedPost } from "@/types/redis";
import { redis } from "@/lib/redis";
import { z } from "zod";

const CACHE_AFTER_UPVOTES = 1;

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestBody = await request.json();

    const { postId, voteType } = PostVoteValidator.parse(requestBody);

    const existingVote = await db.vote.findFirst({
      where: {
        userId: session.user.id,
        postId,
      },
    });

    const post = await db.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        author: true,
        votes: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (existingVote) {
      //the user revotes the post
      if (existingVote.type === voteType) {
        await db.vote.delete({
          where: {
            userId_postId: {
              postId,
              userId: session.user.id,
            },
          },
        });
        return new Response("OK");
      }

      //different voteType
      await db.vote.update({
        where: {
          userId_postId: {
            postId,
            userId: session.user.id,
          },
        },
        data: {
          type: voteType,
        },
      });

      //recount the votes
      const votesAmount = post.votes.reduce((acc, vote) => {
        if (vote.type === "UP") {
          return acc + 1;
        }
        if (vote.type === "DOWN") {
          return acc - 1;
        }
        return acc;
      }, 0);

      //redis cache!
      if (votesAmount >= CACHE_AFTER_UPVOTES) {
        const cachePayload: CachedPost = {
          authorUsername: post.author.username ?? "",
          content: JSON.stringify(post.content),
          id: post.id,
          title: post.title,
          currentVoteType: voteType,
          createdAt: post.createdAt,
        };
        //set the cache
        await redis.hset(`post: ${postId}`, cachePayload);
      }
      return new Response("OK");
    }
    //no existing vote
    await db.vote.create({
      data: {
        type: voteType,
        userId: session.user.id,
        postId: postId,
      },
    });

    //recount the votes
    const votesAmount = post.votes.reduce((acc, vote) => {
      if (vote.type === "UP") {
        return acc + 1;
      }
      if (vote.type === "DOWN") {
        return acc - 1;
      }
      return acc;
    }, 0);

    //redis cache!
    if (votesAmount >= CACHE_AFTER_UPVOTES) {
      const cachePayload: CachedPost = {
        authorUsername: post.author.username ?? "",
        content: JSON.stringify(post.content),
        id: post.id,
        title: post.title,
        currentVoteType: voteType,
        createdAt: post.createdAt,
      };
      //set the cache
      await redis.hset(`post: ${postId}`, cachePayload);
    }

    return new Response("OK");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Could not register your vote due to an unexpected error." },
      { status: 500 }
    );
  }
}

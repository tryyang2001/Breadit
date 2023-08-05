import { CommentVoteValidator, PostVoteValidator } from "@/lib/validators/vote";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestBody = await request.json();

    const { commentId, voteType } = CommentVoteValidator.parse(requestBody);

    const existingVote = await db.commentVote.findFirst({
      where: {
        userId: session.user.id,
        commentId,
      },
    });

    if (existingVote) {
      //the user revotes the post
      if (existingVote.type === voteType) {
        await db.commentVote.delete({
          where: {
            userId_commentId: {
              commentId,
              userId: session.user.id,
            },
          },
        });

        return new Response("OK");
      }

      //different voteType
      await db.commentVote.update({
        where: {
          userId_commentId: {
            commentId,
            userId: session.user.id,
          },
        },
        data: {
          type: voteType,
        },
      });

      return new Response("OK");
    }

    //no existing vote
    await db.commentVote.create({
      data: {
        type: voteType,
        userId: session.user.id,
        commentId: commentId,
      },
    });

    return new Response("OK");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.log(error);
    return NextResponse.json(
      { error: "Could not register your vote due to an unexpected error." },
      { status: 500 }
    );
  }
}

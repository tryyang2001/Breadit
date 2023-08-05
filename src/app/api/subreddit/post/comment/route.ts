import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { CommentValidator } from "@/lib/validators/comment";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function PATCH(request: NextRequest) {
  try {
    const requestBody = await request.json();

    const { postId, text, replyToId } = CommentValidator.parse(requestBody);

    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comment = await db.comment.create({
      data: {
        text,
        postId,
        authorId: session.user.id,
        replyToId,
      },
    });

    return new Response("OK")
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.log(error);
    return NextResponse.json(
      { error: "Could not post the comment due to an unexpected error." },
      { status: 500 }
    );
  }
}

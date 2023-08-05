import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PostValidator } from "@/lib/validators/post";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestBody = await request.json();

    const { subredditId, title, content } = PostValidator.parse(requestBody);

    const subscriptionExists = await db.subscription.findFirst({
      where: {
        subredditId,
        userId: session.user.id,
      },
    });

    if (!subscriptionExists) {
      return NextResponse.json(
        { error: "Subscribe to post" },
        { status: 400 }
      );
    }

    await db.post.create({
      data: {
        title,
        content,
        authorId: session.user.id,
        subredditId
      },
    });

    return new Response('OK');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.log(error);
    return NextResponse.json(
      { error: "Could not post to subreddit due to an unexpected error." },
      { status: 500 }
    );
  }
}

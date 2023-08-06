import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubredditSubscriptionVaidator } from "@/lib/validators/subreddit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestBody = await request.json();

    const { subredditId } = SubredditSubscriptionVaidator.parse(requestBody);

    const subscriptionExists = await db.subscription.findFirst({
      where: {
        subredditId,
        userId: session.user.id,
      },
    });

    if (!subscriptionExists) {
      return NextResponse.json(
        { error: "You are not subscribed to the community yet." },
        { status: 400 }
      );
    }

    //check if user is the creator of the subreddit
    const subreddit = await db.subreddit.findFirst({
        where: {
            id: subredditId,
            creatorId: session.user.id
        }
    })

    if (subreddit) {
        return NextResponse.json(
            {error: "Owner cannot unsubscribe from your own subreddit"},
            {status: 400}
        )
    }

    await db.subscription.delete({
      where: {
        userId_subredditId: {
            subredditId,
            userId: session.user.id
        }
      },
    });

    return new Response(subredditId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Could not subscribe due to an unexpected error." },
      { status: 500 }
    );
  }
}

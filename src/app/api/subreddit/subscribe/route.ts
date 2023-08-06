import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubredditSubscriptionVaidator } from "@/lib/validators/subreddit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: NextRequest) {
    try {
        const session = await getAuthSession();

        if (!session?.user) {
            return NextResponse.json(
                {error: 'Unauthorized'},
                {status: 401}
            )
        }

        const requestBody = await request.json();

        const {subredditId} = SubredditSubscriptionVaidator.parse(requestBody);

        const subscriptionExists = await db.subscription.findFirst({
            where: {
                subredditId,
                userId: session.user.id
            }
        })

        if (subscriptionExists) {
            return NextResponse.json(
                {error: "Duplicated subscription detected, action cancelled"},
                {status: 409}
            )
        }

        await db.subscription.create({
            data: {
                subredditId,
                userId: session.user.id
            }
        });

        return new Response(subredditId);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: error.message }, { status: 422 });
        }
        return NextResponse.json(
          { error: "Could not subscribe due to an unexpected error." },
          { status: 500 }
        );
    }
}
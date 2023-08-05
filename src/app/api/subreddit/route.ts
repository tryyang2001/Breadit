import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubredditValidator } from "@/lib/validators/subreddit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request : NextRequest) {
    try {
        const session = await getAuthSession();

        if(!session?.user) {
            return NextResponse.json(
                {error: 'Unauthorized'}, 
                {status: 401}
            )
        }

        const requestBody = await request.json();

        //check the subreddit input is valid
        const {name} = SubredditValidator.parse(requestBody);

        const hasSubreddit = await db.subreddit.findFirst({
            where: {
                name
            }
        });

        if (hasSubreddit) {
            return NextResponse.json(
                {error: "Subreddit already exists"},
                {status: 409}
            )
        }

        const subreddit = await db.subreddit.create({
            data: {
                name,
                creatorId: session.user.id,
            }
        })

        await db.subscription.create({
            data: {
                userId: session.user.id,
                subredditId: subreddit.id
            }
        })
        
        //return successful status code
        return new Response(subreddit.name, {status: 200});
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {error: error.message},
                {status: 422}
            )
        }
        console.log(error)
        return NextResponse.json(
            {error: "Could not create subreddit due to an unexpected error."},
            {status: 500}
        )
    }
}
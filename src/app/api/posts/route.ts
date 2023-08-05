import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const session = await getAuthSession();

  const url = new URL(request.url);

  let followedCommunitiesIds: string[] = [];

  if (session) {
    const followedCommunities = await db.subscription.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        subreddit: true,
      },
    });

    followedCommunitiesIds = followedCommunities.map(({ subreddit }) => {
      return subreddit.id;
    });
  }

  try {
    const { subredditName, limit, page } = z
      .object({
        limit: z.string(),
        page: z.string(),
        subredditName: z.string().nullish().optional(),
      })
      .parse({
        subredditName: url.searchParams.get("subredditName"),
        limit: url.searchParams.get("limit"),
        page: url.searchParams.get("page"),
      });

    let whereClause = {};

    if (subredditName) {
      whereClause = {
        subreddit: {
          name: subredditName,
        },
      };
    } else if (session) {
      whereClause = {
        subreddit: {
          id: {
            in: followedCommunitiesIds,
          },
        },
      };
    }

    const posts = await db.post.findMany({
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      orderBy: {
        createdAt: "desc",
      },
      include: {
        subreddit: true,
        votes: true,
        comments: true,
        author: true
      },
      where: whereClause,
    });

    return new Response(JSON.stringify(posts), { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.log(error);
    return NextResponse.json(
      { error: "Could not fetch more posts due to an unexpected error." },
      { status: 500 }
    );
  }
}

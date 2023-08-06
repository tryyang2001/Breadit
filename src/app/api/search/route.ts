import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')

    if (!q) {
        return NextResponse.json(
            {error: "Invalid query"},
            {status: 400}
        )
    }

    const results = await db.subreddit.findMany({
        where: {
            name: {
                startsWith: q
            }
        },
        include: {
            _count: true
        },
        take: 5
    })

    return new Response(JSON.stringify(results));
}
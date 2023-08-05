import {z} from 'zod' //schema validation library

export const SubredditValidator = z.object({
    name: z.string().min(3).max(21),

})

export const SubredditSubscriptionVaidator = z.object({
    subredditId: z.string()
})

export type CreateSubredditPayload = z.infer<typeof SubredditValidator>
export type SubscribeToSubredditPayload = z.infer<typeof SubredditSubscriptionVaidator>;

import {z} from 'zod'

export const PostValidator = z.object({
    // the post title
    title: z.string()
            .min(3, {message: 'Title must be longer than 3 characters'})
            .max(128, {message: 'Title must not exceed 128 characters'}),
    //subreddit id
    subredditId: z.string(),
    content: z.any()
})

export type CreatePostRequest = z.infer<typeof PostValidator>
import { Button } from '@/components/ui/Button';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import PostEditor from '../../../../components/PostEditor';

interface PageProps {
    params: {
        name: string
    }
}

const page = async ({params} : PageProps) => {
    const subreddit = await db.subreddit.findFirst({
        where: {
            name: params.name
        }
    });

    if (!subreddit) {
        return notFound();
    }
    return <div className="flex flex-col items-start gap-6">
        <div className="border-b border-gray-200 pb-5">
            <div className="-ml-2 -mt-2 flex fle-wrap items-baseline">
                <h3 className="ml-2 mt-2 text-base font-semibold leading-6 text-gray-900">
                    Create Post
                </h3>
                <p className='ml-2 mt-1 truncate text-sm text-gray-500'>in r/{params.name}</p>
            </div>
        </div>

        {/* form */}
        <PostEditor subredditId={subreddit.id} />
        <div className="w-full flex justify-end">
            <Button className='w-full' type='submit' form='subreddit-post-form'>
                Post
            </Button>
        </div>
    </div>
}

export default page
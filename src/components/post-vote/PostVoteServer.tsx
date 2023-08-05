import { getAuthSession } from "@/lib/auth";
import { Post, Vote, VoteType } from "@prisma/client";
import { notFound } from "next/navigation";
import PostVoteClient from "./PostVoteClient";

interface PostVoteServerProps {
  postId: string;
  initialVotesAmount: number;
  initialVote: VoteType | null;
  getData: () => Promise<(Post & { votes: Vote[] }) | null>;
}

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms))

const PostVoteServer = async ({
  postId,
  initialVote,
  initialVotesAmount,
  getData,
}: PostVoteServerProps) => {
  const session = await getAuthSession();

  let _voteAmount: number = 0;
  let _currentVote: VoteType | null | undefined = undefined;

  if (getData) {
    await wait(2000)
    const post = await getData();
    if (!post) {
      return notFound();
    }
    _voteAmount = post.votes.reduce((acc, vote) => {
      if (vote.type === "UP") {
        return acc + 1;
      } else if (vote.type === "DOWN") {
        return acc - 1;
      } else {
        return acc;
      }
    }, 0);

    _currentVote = post.votes.find(
      (vote) => vote.userId === session?.user.id
    )?.type;
  } else {
    //no getData function
    _voteAmount = initialVotesAmount!;
    _currentVote = initialVote;
  }

  return (
    <PostVoteClient
      postId={postId}
      initialVoteAmount={_voteAmount}
      initialVote={_currentVote}
    />
  );
};

export default PostVoteServer;

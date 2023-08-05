"use client";

import { FC, useRef, useState } from "react";
import UserAvatar from "./UserAvatar";
import { Comment, CommentVote, User } from "@prisma/client";
import { formatTimeToNow } from "@/lib/utils";
import CommentVotes from "./CommentVotes";
import { Button } from "@/components/ui/Button";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Label } from "./ui/Label";
import { Textarea } from "./ui/Textarea";
import { useMutation } from "@tanstack/react-query";
import { CommentRequest } from "../lib/validators/comment";
import axios, { AxiosError } from "axios";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { toast } from "@/hooks/use-toast";

type ExtendedComment = Comment & {
  votes: CommentVote[];
  author: User;
};

interface PostCommentProps {
  postId: string;
  comment: ExtendedComment;
  votesAmount: number;
  currentVote: CommentVote | undefined;
}

const PostComment: FC<PostCommentProps> = ({
  postId,
  comment,
  votesAmount,
  currentVote,
}) => {
  const commentRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { data: session } = useSession();
  const [isReplying, setReplying] = useState(false);

  const [input, setInput] = useState("");

  const { loginToast } = useCustomToast();

  const { mutate: reply, isLoading } = useMutation({
    mutationFn: async ({ postId, text, replyToId }: CommentRequest) => {
      const payload: CommentRequest = {
        postId,
        text,
        replyToId,
      };
      const { data } = await axios.patch(
        `/api/subreddit/post/comment`,
        payload
      );
      return data;
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          return loginToast();
        }
      }

      return toast({
        title: "There was a problem",
        description: "Unable to create the post comment, please try again!",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      router.refresh();
      setReplying(false);
      setInput('')
    }
  });

  return (
    <div className="flex flex-col" ref={commentRef}>
      <div className="flex items-center">
        <UserAvatar
          user={{
            name: comment.author.name || null,
            image: comment.author.image || null,
          }}
          className="h-6 w-6"
        />

        <div className="ml-2 flex items-center gap-x-2">
          <p className="text-sm font-medium text-gray-900">
            u/{comment.author.username}
          </p>
          <p className="max-h-40 truncate text-xs text-zinc-500">
            {formatTimeToNow(new Date(comment.createdAt))}
          </p>
        </div>
      </div>

      <p className="text-sm text-zinc-500 mt-2">{comment.text}</p>

      <div className="flex gap-2 items-center flex-wrap">
        <CommentVotes
          commentId={comment.id}
          initialVoteAmount={votesAmount}
          initialVote={currentVote}
        />

        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            if (!session) {
              return router.push("/sign-in");
            }
            setReplying(true);
          }}
        >
          <MessageSquare className="h-4 w-4 mr-1.5" />
          Reply
        </Button>
        {isReplying ? (
          <div className="grid w-full gap-1.5">
            <Label>Your reply</Label>

            <div className="mt-2">
              <Textarea
                id="comment"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder="What are your thoughts?"
              />
            </div>

            <div className="mt-2 flex justify-end">
              <Button
                tabIndex={-1}
                variant="subtle"
                onClick={() => setReplying(false)}
              >
                Cancel
              </Button>
              <Button
                isLoading={isLoading}
                disabled={input.length === 0}
                onClick={() => {
                  if (!input) {
                    return null;
                  }
                  reply({
                    postId,
                    text: input,
                    replyToId: comment.replyToId ?? comment.id,
                  });
                }}
              >
                Post
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PostComment;

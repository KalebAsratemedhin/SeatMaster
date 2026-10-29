"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import {
  useListCommentsQuery,
  useCreateCommentMutation,
  type EventCommentResponse,
} from "@/lib/api/commentsApi";
import type { RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitialsFromName } from "@/lib/user-display";
import { Loader2, MessageSquare, Reply, Send } from "lucide-react";

type CommentNode = { comment: EventCommentResponse; replies: CommentNode[] };

export function EventGuestComments({ eventId }: { eventId: string }) {
  const token = useSelector((s: RootState) => s.auth.token);
  const { data: commentsData } = useListCommentsQuery(
    { eventId, limit: 50, offset: 0 },
    { skip: !eventId }
  );
  const comments = commentsData?.items ?? [];
  const [createComment, { isLoading: isPosting }] = useCreateCommentMutation();
  const [commentBody, setCommentBody] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const commentTree = useMemo(() => {
    const byParent = new Map<string | null, EventCommentResponse[]>();
    byParent.set(null, []);
    for (const c of comments) {
      const key = c.parent_id ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(c);
    }
    const build = (parentKey: string | null): CommentNode[] =>
      (byParent.get(parentKey) ?? [])
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((c) => ({ comment: c, replies: build(c.id) }));
    return build(null);
  }, [comments]);

  const handlePost = (e: React.FormEvent, parentId?: string | null) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    if (!token) return;
    createComment({ eventId, body: commentBody.trim(), parentId: parentId ?? null })
      .unwrap()
      .then(() => {
        setCommentBody("");
        setReplyingToId(null);
      })
      .catch(() => {});
  };

  const renderNodes = (nodes: CommentNode[], depth: number) =>
    nodes.map((node) => (
      <div
        key={node.comment.id}
        className={depth > 0 ? "ml-6 mt-2 border-l-2 border-slate-200/60 dark:border-slate-600 pl-4" : ""}
      >
        <div className="flex gap-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 p-4">
          <Avatar className="size-9 shrink-0 border border-slate-200/60 dark:border-slate-600">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {getInitialsFromName(node.comment.author)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {node.comment.author}
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">
              {node.comment.body}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {new Date(node.comment.created_at).toLocaleString()}
              </p>
              {token && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 -ml-1 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                  onClick={() => {
                    setReplyingToId(node.comment.id);
                    setCommentBody("");
                  }}
                >
                  <Reply className="mr-1 size-3.5" />
                  Reply
                </Button>
              )}
            </div>
          </div>
        </div>
        {replyingToId === node.comment.id && token && (
          <form
            onSubmit={(e) => handlePost(e, node.comment.id)}
            className="mt-2 ml-12 flex gap-2"
          >
            <Input
              placeholder="Write a reply..."
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              className="flex-1 rounded-lg text-sm"
              maxLength={2000}
              autoFocus
            />
            <Button
              type="submit"
              disabled={isPosting || !commentBody.trim()}
              size="sm"
              className="rounded-lg"
            >
              {isPosting ? <Loader2 className="size-4 animate-spin" /> : "Reply"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setReplyingToId(null);
                setCommentBody("");
              }}
            >
              Cancel
            </Button>
          </form>
        )}
        {node.replies.length > 0 && renderNodes(node.replies, depth + 1)}
      </div>
    ));

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <MessageSquare className="mt-0.5 size-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Comments</h2>
          <p className="text-sm text-muted-foreground">
            Public conversation for everyone with access to this event.
          </p>
        </div>
      </div>

      {token ? (
        <form onSubmit={(e) => handlePost(e)} className="flex gap-3">
          <Input
            placeholder="Write a comment..."
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            className="flex-1 rounded-xl"
            maxLength={2000}
          />
          <Button
            type="submit"
            disabled={isPosting || !commentBody.trim()}
            className="shrink-0 rounded-xl"
          >
            {isPosting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Post
          </Button>
        </form>
      ) : (
        <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <Link
            href={`/auth?mode=signin&redirect=${encodeURIComponent(`/invite/${eventId}?tab=comments&continue=1`)}`}
            className="font-medium text-primary underline"
          >
            Sign in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      <div className="space-y-3">
        {commentTree.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          renderNodes(commentTree, 0)
        )}
      </div>
    </div>
  );
}

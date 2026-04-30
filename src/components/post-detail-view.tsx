"use client";

import BoardPostEditorModal from "@/components/board-post-editor-modal";
import ConfirmModal from "@/components/confirm-modal";
import PostCommentsSection from "@/components/post-comments-section";
import PostDetailCard from "@/components/post-detail-card";
import PostStatusSelector from "@/components/post-status-selector";
import { useToast } from "@/components/toast-provider";
import {
  createBoardComment,
  deleteBoardComment,
  deleteBoardPost,
  updateBoardPost,
  updateBoardPostStatus,
} from "@/lib/board-api-client";
import { usePortalTarget } from "@/lib/client-dom";
import { toWorkTerminology } from "@/lib/terminology";
import { Board, BoardComment, BoardPost } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  board: Board;
  initialPost: BoardPost;
  initialComments: BoardComment[];
  postAuthorName: string;
  postAuthorAvatar: string | null;
  canEdit: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
}

export default function PostDetailView({
  board,
  initialPost,
  initialComments,
  postAuthorName,
  postAuthorAvatar,
  canEdit,
  canDelete,
  canChangeStatus,
}: Props) {
  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState(initialComments);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(toWorkTerminology(initialPost.title));
  const [editBody, setEditBody] = useState(toWorkTerminology(initialPost.body));
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDeletePost, setConfirmingDeletePost] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [commentIdToDelete, setCommentIdToDelete] = useState<string | null>(null);

  const headerSlot = usePortalTarget("post-header-actions");
  const toast = useToast();
  const router = useRouter();

  async function savePost(event: React.FormEvent) {
    event.preventDefault();
    setSavingEdit(true);
    const result = await updateBoardPost(board.slug, post.id, {
      title: editTitle,
      body: editBody,
    });
    setSavingEdit(false);

    if (!result.ok) {
      toast.error(result.error || "수정에 실패했습니다");
      return;
    }

    setPost((prev) => ({ ...prev, title: editTitle, body: editBody }));
    setEditing(false);
    toast.success("글을 수정했습니다");
  }

  async function deletePost() {
    setDeleting(true);
    const result = await deleteBoardPost(board.slug, post.id);
    setDeleting(false);
    setConfirmingDeletePost(false);

    if (!result.ok) {
      toast.error(result.error || "삭제에 실패했습니다");
      return;
    }

    toast.success("글을 삭제했습니다");
    router.push(`/boards/${board.slug}`);
  }

  async function changeStatus(next: "requested" | "accepted" | "resolved") {
    if (next === post.status) return;

    setSavingStatus(true);
    const result = await updateBoardPostStatus(board.slug, post.id, next);
    setSavingStatus(false);

    if (!result.ok) {
      toast.error(result.error || "상태 변경에 실패했습니다");
      return;
    }

    setPost((prev) => ({ ...prev, status: next }));
    toast.success("상태를 변경했습니다");
  }

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    const body = commentBody.trim();
    if (body.length < 1) return;

    setSubmittingComment(true);
    const result = await createBoardComment(board.slug, post.id, body);
    setSubmittingComment(false);

    if (!result.ok) {
      toast.error(result.error || "댓글 작성에 실패했습니다");
      return;
    }

    setComments((prev) => [...prev, result.data.comment as BoardComment]);
    setCommentBody("");
    toast.success("댓글을 등록했습니다");
  }

  async function deleteComment() {
    if (!commentIdToDelete) return;

    const result = await deleteBoardComment(
      board.slug,
      post.id,
      commentIdToDelete
    );

    if (!result.ok) {
      toast.error(result.error || "삭제에 실패했습니다");
      return;
    }

    setComments((prev) =>
      prev.filter((comment) => comment.id !== commentIdToDelete)
    );
    setCommentIdToDelete(null);
    toast.success("댓글을 삭제했습니다");
  }

  const headerActions = (canEdit || canDelete) && (
    <div className="flex items-center gap-1">
      {canEdit && (
        <button
          type="button"
          onClick={() => {
            setEditTitle(toWorkTerminology(post.title));
            setEditBody(toWorkTerminology(post.body));
            setEditing(true);
          }}
          className="interactive-press rounded-md px-2 py-1 text-xs font-medium"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-secondary)",
          }}
        >
          수정
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={() => setConfirmingDeletePost(true)}
          disabled={deleting}
          className="interactive-press rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50"
          style={{
            backgroundColor: "var(--error-bg)",
            color: "var(--error)",
          }}
        >
          {deleting ? "삭제 중…" : "삭제"}
        </button>
      )}
    </div>
  );

  return (
    <div className="px-4 lg:px-0">
      {headerSlot && headerActions && createPortal(headerActions, headerSlot)}

      <PostDetailCard
        authorName={postAuthorName}
        authorAvatar={postAuthorAvatar}
        createdAt={post.created_at}
        body={post.body}
        status={post.status}
        showStatusBadge={board.has_status && !canChangeStatus}
        statusContent={
          canChangeStatus ? (
            <PostStatusSelector
              currentStatus={post.status}
              disabled={savingStatus}
              onChange={changeStatus}
            />
          ) : undefined
        }
      />

      {board.allow_comments && (
        <PostCommentsSection
          comments={comments}
          commentBody={commentBody}
          submitting={submittingComment}
          canDelete={canDelete}
          onChangeCommentBody={setCommentBody}
          onSubmit={submitComment}
          onDelete={setCommentIdToDelete}
        />
      )}

      <BoardPostEditorModal
        open={editing}
        modalTitle="글 수정"
        titleValue={editTitle}
        bodyValue={editBody}
        saving={savingEdit}
        submitLabel="저장"
        bodyRows={10}
        onClose={() => setEditing(false)}
        onChangeTitle={setEditTitle}
        onChangeBody={setEditBody}
        onSubmit={savePost}
      />

      {confirmingDeletePost && (
        <ConfirmModal
          title="글 삭제"
          description="이 글을 삭제할까요? 되돌릴 수 없습니다."
          confirmLabel="삭제하기"
          destructive
          loading={deleting}
          onClose={() => setConfirmingDeletePost(false)}
          onConfirm={deletePost}
        />
      )}

      {commentIdToDelete && (
        <ConfirmModal
          title="댓글 삭제"
          description="댓글을 삭제할까요?"
          confirmLabel="삭제하기"
          destructive
          onClose={() => setCommentIdToDelete(null)}
          onConfirm={deleteComment}
        />
      )}
    </div>
  );
}

import {
  buildAuthorMap,
  collectAuthorIds,
  enrichBoardCommentsWithAuthors,
  enrichBoardPostsWithAuthors,
  formatBoardAuthorName,
  resolveBoardAuthorAvatar,
} from "@/lib/board-authors";
import { createClient } from "@/lib/supabase/server";
import { BoardComment, BoardPost } from "@/lib/types";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

interface LoadBoardPostsDataParams {
  supabase: ServerSupabase;
  boardId: string;
  isAdmin: boolean;
}

interface LoadBoardPostDetailDataParams {
  supabase: ServerSupabase;
  boardId: string;
  postId: string;
  viewerUserId: string;
  isAdmin: boolean;
  hasStatus: boolean;
}

interface BoardPostDetailData {
  post: BoardPost;
  enrichedComments: BoardComment[];
  postAuthorName: string;
  postAuthorAvatar: string | null;
  canEdit: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
}

async function loadAuthorMap(
  supabase: ServerSupabase,
  authorIds: string[]
) {
  if (authorIds.length === 0) {
    return buildAuthorMap([]);
  }

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, display_name, avatar_url")
    .in("id", authorIds);

  return buildAuthorMap(
    (profiles ?? []) as {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
    }[]
  );
}

async function loadBoardManagerStatus(
  supabase: ServerSupabase,
  boardId: string,
  viewerUserId: string,
  isAdmin: boolean
) {
  if (isAdmin) return true;

  const { data: manager } = await supabase
    .from("board_managers")
    .select("user_id")
    .eq("board_id", boardId)
    .eq("user_id", viewerUserId)
    .maybeSingle();

  return Boolean(manager);
}

export async function loadBoardPostsData({
  supabase,
  boardId,
  isAdmin,
}: LoadBoardPostsDataParams) {
  const { data: postData } = await supabase
    .from("board_posts")
    .select(
      "id, board_id, author_id, is_anonymous, title, body, is_pinned, status, created_at, updated_at"
    )
    .eq("board_id", boardId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const posts = (postData as BoardPost[] | null) ?? [];
  const authorMap = await loadAuthorMap(supabase, collectAuthorIds(posts));

  return enrichBoardPostsWithAuthors(posts, authorMap, isAdmin);
}

export async function loadBoardPostDetailData({
  supabase,
  boardId,
  postId,
  viewerUserId,
  isAdmin,
  hasStatus,
}: LoadBoardPostDetailDataParams): Promise<BoardPostDetailData | null> {
  const { data: postData } = await supabase
    .from("board_posts")
    .select(
      "id, board_id, author_id, is_anonymous, title, body, is_pinned, status, created_at, updated_at"
    )
    .eq("id", postId)
    .eq("board_id", boardId)
    .maybeSingle();

  if (!postData) {
    return null;
  }

  const post = postData as BoardPost;
  const { data: commentData } = await supabase
    .from("board_comments")
    .select("id, post_id, author_id, is_anonymous, body, created_at, updated_at")
    .eq("post_id", post.id)
    .order("created_at", { ascending: true });

  const comments = (commentData as BoardComment[] | null) ?? [];
  const authorMap = await loadAuthorMap(
    supabase,
    collectAuthorIds([{ author_id: post.author_id }, ...comments])
  );
  const canEdit = post.author_id === viewerUserId;
  const canDelete = canEdit || isAdmin;
  const canChangeStatus =
    hasStatus &&
    (await loadBoardManagerStatus(supabase, boardId, viewerUserId, isAdmin));

  return {
    post,
    enrichedComments: enrichBoardCommentsWithAuthors(
      comments,
      authorMap,
      isAdmin
    ),
    postAuthorName: formatBoardAuthorName({
      isAnonymous: post.is_anonymous,
      authorId: post.author_id,
      authorMap,
      isAdmin,
    }),
    postAuthorAvatar: resolveBoardAuthorAvatar({
      isAnonymous: post.is_anonymous,
      authorId: post.author_id,
      authorMap,
    }),
    canEdit,
    canDelete,
    canChangeStatus,
  };
}

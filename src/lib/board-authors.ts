import { BoardComment, BoardPost } from "@/lib/types";

export interface AuthorProfileRecord {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export type AuthorMap = Map<
  string,
  { display_name: string | null; avatar_url: string | null }
>;

export function collectAuthorIds(items: Array<{ author_id: string | null }>) {
  return [...new Set(items.map((item) => item.author_id).filter(Boolean))] as string[];
}

export function buildAuthorMap(profiles: AuthorProfileRecord[] | null | undefined) {
  return new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      {
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      },
    ])
  ) as AuthorMap;
}

export function formatBoardAuthorName({
  isAnonymous,
  authorId,
  authorMap,
  isAdmin,
}: {
  isAnonymous: boolean;
  authorId: string | null;
  authorMap: AuthorMap;
  isAdmin: boolean;
}) {
  const realName =
    authorId && authorMap.get(authorId)?.display_name
      ? authorMap.get(authorId)!.display_name!
      : "";

  if (isAnonymous) {
    return isAdmin && realName ? `익명 (${realName})` : "익명";
  }

  return realName || "이름 없음";
}

export function resolveBoardAuthorAvatar({
  isAnonymous,
  authorId,
  authorMap,
}: {
  isAnonymous: boolean;
  authorId: string | null;
  authorMap: AuthorMap;
}) {
  if (isAnonymous || !authorId) return null;
  return authorMap.get(authorId)?.avatar_url ?? null;
}

export function enrichBoardPostsWithAuthors(
  posts: BoardPost[],
  authorMap: AuthorMap,
  isAdmin: boolean
) {
  return posts.map((post) => ({
    ...post,
    author_name: formatBoardAuthorName({
      isAnonymous: post.is_anonymous,
      authorId: post.author_id,
      authorMap,
      isAdmin,
    }),
    author_avatar_url: resolveBoardAuthorAvatar({
      isAnonymous: post.is_anonymous,
      authorId: post.author_id,
      authorMap,
    }),
  }));
}

export function enrichBoardCommentsWithAuthors(
  comments: BoardComment[],
  authorMap: AuthorMap,
  isAdmin: boolean
) {
  return comments.map((comment) => ({
    ...comment,
    author_name: formatBoardAuthorName({
      isAnonymous: comment.is_anonymous,
      authorId: comment.author_id,
      authorMap,
      isAdmin,
    }),
    author_avatar_url: resolveBoardAuthorAvatar({
      isAnonymous: comment.is_anonymous,
      authorId: comment.author_id,
      authorMap,
    }),
  }));
}

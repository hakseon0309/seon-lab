export const CORP_TEAM_NAMES = ["애플 하남", "PZ", "GB", "OPS", "TAA"] as const;

export type CorpTeamName = (typeof CORP_TEAM_NAMES)[number];

export function isCorpTeamName(value: string): value is CorpTeamName {
  return CORP_TEAM_NAMES.includes(value as CorpTeamName);
}

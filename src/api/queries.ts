const PROFILE_FIELDS = `
    name
    login
    avatarUrl
    bio
    followers { totalCount }
    following { totalCount }
    repositories(ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false) { totalCount }
    company
    websiteUrl
    location
    createdAt
    url
`;

const COLLECTION_FIELDS = `
      contributionCalendar {
        weeks {
          contributionDays {
            contributionCount
            date
            color
          }
        }
        totalContributions
      }
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      restrictedContributionsCount
`;

export const USER_PROFILE_QUERY = `
query ($login: String!) {
  user(login: $login) {
${PROFILE_FIELDS}
  }
}
`;

/**
 * One request that fetches several contribution windows at once, aliased as
 * `w0`, `w1`, … with variables `$from0`/`$to0`, `$from1`/`$to1`, …
 */
export function buildContributionsQuery(windowCount: number): string {
  const varDefs = Array.from(
    { length: windowCount },
    (_, i) => `$from${i}: DateTime!, $to${i}: DateTime!`
  ).join(', ');
  const fields = Array.from(
    { length: windowCount },
    (_, i) => `    w${i}: contributionsCollection(from: $from${i}, to: $to${i}) {${COLLECTION_FIELDS}    }`
  ).join('\n');
  return `
query ($login: String!, ${varDefs}) {
  user(login: $login) {
${fields}
  }
}
`;
}

export const USER_REPOS_QUERY = `
query ($login: String!, $first: Int!, $after: String) {
  user(login: $login) {
    repositories(
      first: $first
      after: $after
      ownerAffiliations: OWNER
      privacy: PUBLIC
      isFork: false
      orderBy: { field: STARGAZERS, direction: DESC }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        name
        description
        stargazerCount
        forkCount
        primaryLanguage { name color }
        updatedAt
        createdAt
        url
        isPrivate
      }
    }
  }
}
`;

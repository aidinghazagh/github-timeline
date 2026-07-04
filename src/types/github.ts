export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  company: string | null;
  blog: string | null;
  location: string | null;
  created_at: string;
  html_url: string;
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: {
    name: string;
    color: string;
  } | null;
  updatedAt: string;
  url: string;
  isPrivate: boolean;
}

export interface ContributionDay {
  contributionCount: number;
  date: string;
  color: string;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  weeks: ContributionWeek[];
  totalContributions: number;
}

export interface ContributionsCollection {
  contributionCalendar: ContributionCalendar;
  totalCommitContributions: number;
  totalIssueContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  restrictedContributionsCount: number;
}

export interface UserProfileData {
  user: {
    name: string | null;
    login: string;
    avatarUrl: string;
    bio: string | null;
    followers: { totalCount: number };
    following: { totalCount: number };
    repositories: { totalCount: number };
    company: string | null;
    websiteUrl: string | null;
    location: string | null;
    createdAt: string;
    url: string;
    contributionsCollection: ContributionsCollection;
  };
}

export type TimeRange = '1m' | '90d' | '1y' | 'all';

export type SortOption = 'stars' | 'forks' | 'updated' | 'created' | 'name';

export interface SearchHistory {
  username: string;
  timestamp: number;
  isFavorite: boolean;
}

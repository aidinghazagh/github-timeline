export type GitHubErrorKind =
  | 'not_found'
  | 'invalid_token'
  | 'rate_limited'
  | 'forbidden'
  | 'other';

export class GitHubApiError extends Error {
  readonly kind: GitHubErrorKind;

  constructor(kind: GitHubErrorKind, message: string) {
    super(message);
    this.name = 'GitHubApiError';
    this.kind = kind;
  }
}

export function isInvalidTokenError(err: unknown): boolean {
  return err instanceof GitHubApiError && err.kind === 'invalid_token';
}

function formatReset(resetEpochSeconds: string | null): string {
  const seconds = Number(resetEpochSeconds);
  if (!resetEpochSeconds || !Number.isFinite(seconds)) return '';
  const minutes = Math.max(1, Math.ceil((seconds * 1000 - Date.now()) / 60000));
  return ` Resets in about ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}

/** Turn a non-OK GitHub response into a descriptive error. */
export function errorFromResponse(res: Response, hasToken: boolean): GitHubApiError {
  const remaining = res.headers.get('x-ratelimit-remaining');
  const retryAfter = res.headers.get('retry-after');
  const tokenHint = hasToken ? '' : ' Add a Personal Access Token for a higher limit.';

  if (res.status === 401) {
    return new GitHubApiError(
      'invalid_token',
      'Invalid or expired token. It has been removed — please add a new one.'
    );
  }
  if (res.status === 429 || (res.status === 403 && (remaining === '0' || retryAfter))) {
    const wait = retryAfter
      ? ` Try again in ${retryAfter} seconds.`
      : formatReset(res.headers.get('x-ratelimit-reset'));
    return new GitHubApiError('rate_limited', `GitHub API rate limit exceeded.${wait}${tokenHint}`);
  }
  if (res.status === 403) {
    return new GitHubApiError(
      'forbidden',
      hasToken
        ? 'GitHub refused the request (403). Your token may lack access.'
        : 'GitHub refused the request (403).'
    );
  }
  if (res.status === 404) {
    return new GitHubApiError('not_found', 'User not found');
  }
  return new GitHubApiError('other', `GitHub API error (${res.status})`);
}

/** Run `fn`, calling `onInvalidToken` before rethrowing if GitHub rejected the token. */
export async function withTokenCheck<T>(
  fn: () => Promise<T>,
  onInvalidToken?: () => void
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isInvalidTokenError(err)) onInvalidToken?.();
    throw err;
  }
}

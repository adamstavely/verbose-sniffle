import { defineMiddleware } from 'astro:middleware';
import { getActionContext, ActionError } from 'astro:actions';
import { randomUUID } from 'node:crypto';

const VOTER_COOKIE = 'roadmap_voter_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    // Inline scripts allowlisted by hash so `script-src` stays free of
    // 'unsafe-inline': theme init, theme toggle, sidebar drawer, support modal,
    // back-to-top FAB (byte-stable is:inline), and the page-feedback module
    // Astro inlines on the on-demand roadmap/status pages. Update these if any
    // script's bytes change.
    "script-src 'self' 'sha256-uHjSJ6je3geuIxFbjyT/xbLAuzglm3PUZYoWAUrZyto=' 'sha256-/Jz2sqssm9frp4tFtb76t1+WhNWgOwi6Ej5GmSEOzf4=' 'sha256-UuKa0MbPu5kgKdnOaONHH1NPdKVLwqE0TcVz4lbcjDw=' 'sha256-QM627dG5UHqgNYEWXZ+G3movY2eJtRVjQt2CLLJXTw0=' 'sha256-Hj6/pIe2kDSToseUVHSujktb/hpiiBhfYPMApJcdvE4=' 'sha256-dZArUt0LcowvobguQJ3Sx2QJhMe2jXtENAxNbfdtaaA='",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join('; '),
};

function applySecurityHeaders(response: Response): Response {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Static pages are prerendered at build time and served as static files at
  // runtime (no middleware), so set headers for those at the edge/reverse proxy.
  if (context.isPrerendered) {
    return next();
  }

  if (!context.cookies.has(VOTER_COOKIE)) {
    context.cookies.set(VOTER_COOKIE, randomUUID(), {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
    });
  }

  // When a vote or subscribe form is submitted, run the action and redirect.
  const { action, setActionResult, serializeActionResult } = getActionContext(context);
  const isVoteForm = action?.calledFrom === 'form' && action.name?.endsWith('vote');
  const isSubscribeForm = action?.calledFrom === 'form' && action.name?.endsWith('subscribe');

  let response: Response;
  if (isVoteForm || isSubscribeForm) {
    try {
      const result = await action.handler();
      setActionResult(action.name, serializeActionResult(result));
    } catch (err) {
      // Log the real error server-side; return a generic message so internal
      // details are never surfaced to the user.
      console.error('[middleware] action handler failed', err);
      setActionResult(
        action.name,
        serializeActionResult({
          data: undefined,
          error: new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong. Please try again.',
          }),
        })
      );
    }
    const referer = context.request.headers.get('Referer');
    const redirectTo = referer ? new URL(referer).pathname : '/roadmap';
    response = context.redirect(redirectTo);
  } else {
    response = await next();
  }

  return applySecurityHeaders(response);
});

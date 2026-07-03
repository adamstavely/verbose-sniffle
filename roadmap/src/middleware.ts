import { defineMiddleware } from 'astro:middleware';
import { getActionContext, ActionError } from 'astro:actions';
import { randomUUID } from 'node:crypto';

const VOTER_COOKIE = 'roadmap_voter_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export const onRequest = defineMiddleware(async (context, next) => {
  // Static pages are prerendered at build time where there is no real request
  // (cookies/headers/actions are unavailable); only run for on-demand routes.
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

  // When vote or subscribe form is submitted, run the action and redirect
  const { action, setActionResult, serializeActionResult } = getActionContext(context);
  const isVoteForm = action?.calledFrom === 'form' && action.name?.endsWith('vote');
  const isSubscribeForm = action?.calledFrom === 'form' && action.name?.endsWith('subscribe');
  if (isVoteForm || isSubscribeForm) {
    try {
      const result = await action.handler();
      setActionResult(action.name, serializeActionResult(result));
      const referer = context.request.headers.get('Referer');
      const redirectTo = referer ? new URL(referer).pathname : '/roadmap';
      return context.redirect(redirectTo);
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
      const referer = context.request.headers.get('Referer');
      const redirectTo = referer ? new URL(referer).pathname : '/roadmap';
      return context.redirect(redirectTo);
    }
  }

  return next();
});

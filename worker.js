/**
 * Serves this static link-in-bio page under /linktree/* on the existing zone.
 * The root domain (/) is owned by the portofx-v2 Worker, so this Worker only
 * handles the /linktree path and strips the prefix before asking the assets
 * binding for a file.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // /linktree -> /linktree/
    if (url.pathname === '/linktree') {
      url.pathname = '/linktree/';
      return Response.redirect(url.toString(), 308);
    }

    if (!url.pathname.startsWith('/linktree/')) {
      return new Response('Not found', { status: 404 });
    }

    // /linktree/style.css -> /style.css
    url.pathname = url.pathname.slice('/linktree'.length) || '/';
    return env.ASSETS.fetch(new Request(url, request));
  },
};

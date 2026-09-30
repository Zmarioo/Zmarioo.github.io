export async function onRequestGet(context) {
  const clientId = 'Ov23li0XnSsRfdtaIH1D';
  const redirectUri = 'https://zmarioo-github-io.pages.dev/api/auth/callback';

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;

  return Response.redirect(githubAuthUrl, 302);
}
export async function onRequestGet(context) {
  const { env } = context;
  
  // Usa a variável de ambiente ou o Client ID direto caso a variável não esteja injetada
  const clientId = env.GITHUB_CLIENT_ID || 'Ov23li0gA9SHsX6bfx17';
  const redirectUri = 'https://zmarioo-github-io.pages.dev/api/auth/callback';

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user%20user:email`;

  return Response.redirect(githubAuthUrl, 302);
}
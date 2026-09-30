export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Código de autorização não encontrado.', { status: 400 });
  }

  const clientId = 'Ov23li0XnSsRfdtaIH1D';
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!clientSecret) {
    return new Response('Erro: GITHUB_CLIENT_SECRET não está configurado nas variáveis do Cloudflare.', { status: 500 });
  }

  try {
    // Solicita o token de acesso ao GitHub
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(`Erro do GitHub: ${tokenData.error_description || tokenData.error}`, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    // Obtém os dados do utilizador autenticado
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'User-Agent': 'Cloudflare-Pages-App'
      }
    });

    const userData = await userResponse.json();

    // Redireciona de volta para a página inicial com o nome e foto do utilizador
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('user', userData.login);
    redirectUrl.searchParams.set('avatar', userData.avatar_url);

    return Response.redirect(redirectUrl.toString(), 302);

  } catch (err) {
    return new Response(`Erro ao obter token: ${err.message}`, { status: 500 });
  }
}
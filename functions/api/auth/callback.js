export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Código de autorização não fornecido.", { status: 400 });
  }

  try {
    // 1. Troca o código pelo Token de acesso do GitHub
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      return new Response(`Erro ao obter token: ${tokenData.error_description}`, { status: 400 });
    }

    // 2. Procura os dados do utilizador no GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "User-Agent": "Cloudflare-Pages-App"
      }
    });
    const userData = await userResponse.json();

    let userEmail = userData.email;
    if (!userEmail) {
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`,
          "User-Agent": "Cloudflare-Pages-App"
        }
      });
      const emails = await emailResponse.json();
      const primaryEmail = emails.find(e => e.primary) || emails[0];
      userEmail = primaryEmail ? primaryEmail.email : `${userData.login}@github.com`;
    }

    const userId = `github_${userData.id}`;
    const userName = userData.name || userData.login;

    // 3. Guarda ou atualiza na base de dados D1
    await env.DB.prepare(`
      INSERT INTO users (id, email, name, provider)
      VALUES (?, ?, ?, 'github')
      ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        created_at = CURRENT_TIMESTAMP
    `).bind(userId, userEmail, userName).run();

    // 4. Redireciona de volta para a página inicial com os dados
    const responseHeader = new Headers();
    responseHeader.set("Location", `/?logged_in=true&name=${encodeURIComponent(userName)}&email=${encodeURIComponent(userEmail)}`);

    return new Response(null, {
      status: 302,
      headers: responseHeader
    });

  } catch (err) {
    return new Response(`Erro interno: ${err.message}`, { status: 500 });
  }
}

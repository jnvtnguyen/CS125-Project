type AuthRequest = {
  code?: string;
  redirect_uri?: string;
  refresh_token?: string;
};

type AccessData = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
};

export async function POST(request: Request) {
  try {
    const { code, redirect_uri, refresh_token }: AuthRequest = await request.json();

    // Handle token refresh
    if (refresh_token) {
      const refreshed = await refresh_access_token(refresh_token);
      return new Response(
        JSON.stringify({
          status: "Success",
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          expires_in: refreshed.expires_in,
          scope: refreshed.scope,
          token_type: refreshed.token_type,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Handle initial authorization code exchange
    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: "Missing Code or Redirect URI." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const access_info: AccessData = await get_access_token(code);

    return new Response(
      JSON.stringify({
        status: "Success",
        access_token: access_info.access_token,
        refresh_token: access_info.refresh_token,
        expires_in: access_info.expires_in,
        scope: access_info.scope,
        token_type: access_info.token_type,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(JSON.stringify({ error: "Unexpected Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function get_access_token(code: string): Promise<AccessData> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET,
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "algo-rhythm://spotify-auth-callback",
    }),
  });

  return response.json();
}

async function refresh_access_token(refresh_token: string): Promise<AccessData> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET,
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
    }),
  });

  return response.json();
}
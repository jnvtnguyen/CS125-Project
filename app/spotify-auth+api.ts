type AuthRequest = {
  code?: string;
  redirect_uri?: string;
};

export async function POST(request: Request) {
  try {
    const { code, redirect_uri }: AuthRequest = await request.json();

    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: "Missing Code or Redirect URI." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get Access Token from Spotify
  } catch {
    return new Response(JSON.stringify({ error: "Unexpected Server Error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

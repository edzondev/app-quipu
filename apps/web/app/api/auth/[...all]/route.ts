import { checkBotId } from "botid/server";
import { type NextRequest, NextResponse } from "next/server";
import { handler } from "@/auth/auth-server";
import { enforceAuthTurnstile } from "@/lib/turnstile/verify";

async function guardAuthPost(
  request: NextRequest,
): Promise<NextResponse | null> {
  if (request.method !== "POST") return null;

  const botCheck = await checkBotId({
    developmentOptions: {
      bypass: "GOOD-BOT",
    },
  });
  if (botCheck.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const result = await enforceAuthTurnstile({
    pathname: request.nextUrl.pathname,
    token: request.headers.get("x-cf-turnstile-token"),
    remoteIp:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    cookieHeader: request.headers.get("cookie"),
  });

  if (!result.blocked) return null;
  return NextResponse.json({ error: result.error }, { status: result.status });
}

export async function GET(request: NextRequest) {
  return handler.GET(request);
}

export async function POST(request: NextRequest) {
  const blocked = await guardAuthPost(request);
  if (blocked) return blocked;
  return handler.POST(request);
}

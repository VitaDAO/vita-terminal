import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { signIn } from "@/app/(auth)/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  const isProduction = process.env.NODE_ENV === "production";
  const isHttps = process.env.NEXTAUTH_URL?.startsWith("https://") || isProduction;
  const cookieName = isHttps ? "__Secure-authjs.session-token" : "authjs.session-token";

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName,
    secureCookie: isHttps,
  });

  if (token) {
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  try {
    await signIn("guest", { redirect: false });
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error("Guest signin error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

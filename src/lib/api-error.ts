import { NextResponse } from "next/server";

/**
 * Return a safe error response that doesn't leak internal details.
 * Full error is logged server-side for debugging.
 */
export function safeErrorResponse(
  error: unknown,
  context: string,
  status: number = 500
) {
  console.error(`[API:${context}]`, error);

  return NextResponse.json(
    { error: "An internal error occurred. Please try again later." },
    { status }
  );
}

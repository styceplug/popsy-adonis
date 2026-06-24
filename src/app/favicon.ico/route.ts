import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  const image = await readFile(path.join(process.cwd(), "public", "favicon.jpg"));

  return new NextResponse(image, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}

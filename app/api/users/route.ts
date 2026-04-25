import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/store";

// GET /api/users
export async function GET() {
  return NextResponse.json(store.getUsers());
}

// POST /api/users  { handle, name, followers, avatarColor }
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.handle) return NextResponse.json({ error: "handle required" }, { status: 400 });

  const user = store.addUser({
    handle: body.handle.replace(/^@/, ""),
    name: body.name ?? body.handle,
    followers: body.followers ?? 0,
    avatarColor: body.avatarColor ?? "#3b7dd8",
    isActive: false,
  });
  return NextResponse.json(user, { status: 201 });
}

// DELETE /api/users?id=xxx
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  store.removeUser(id);
  return NextResponse.json({ ok: true });
}

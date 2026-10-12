import { NextRequest, NextResponse } from 'next/server';
import { editorFromRequest } from '@/lib/api';

export async function GET(request: NextRequest) {
  const editor = await editorFromRequest(request);
  return NextResponse.json({ editor: !!editor, email: editor?.email ?? null });
}

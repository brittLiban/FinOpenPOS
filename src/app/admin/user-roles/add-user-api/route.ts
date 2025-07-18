import { NextRequest, NextResponse } from 'next/server';
import { addUser } from '../role-utils';

export async function POST(req: NextRequest) {
  try {
    const { email, password, role_id } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }
    const userId = await addUser(email, password, role_id);
    return NextResponse.json({ userId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add user.' }, { status: 500 });
  }
}

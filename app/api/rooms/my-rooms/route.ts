import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    
    // Get rooms created by user
    const createdRooms = await db.collection('rooms')
      .find({ creatorId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    // Get rooms user participated in
    const participatedRooms = await db.collection('rooms')
      .find({ 
        'participants.userId': session.user.id,
        creatorId: { $ne: session.user.id }
      })
      .sort({ 'participants.joinedAt': -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({
      createdRooms,
      participatedRooms
    });

  } catch (error) {
    console.error('Fetch my rooms error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}
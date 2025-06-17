import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDb } from "@/lib/mongodb";

// GET - List user's rooms or public rooms
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    
    const type = searchParams.get('type') || 'my'; // 'my', 'public', 'joined'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'waiting', 'active', 'completed'
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    const db = await getDb();
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    const sort: Record<string, 1 | -1> = { createdAt: -1 };

    // Build query based on type
    if (type === 'my' && session?.user?.id) {
  query.creatorId = session.user.id;
} else if (type === 'public') {
  query.isPublic = true;
  // Only show waiting and active public rooms, exclude cancelled ones
  query.status = { $in: ['waiting', 'active'] };
} else if (type === 'joined' && session?.user?.id) {
  query['participants.userId'] = session.user.id;
} else if (!session?.user?.id && type === 'public') {
  // For unauthenticated users, only show public rooms
  query.isPublic = true;
  query.status = { $in: ['waiting', 'active'] };
}


    if (search) {
  const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  (query.$and = (query.$and as any[] || []));
  (query.$and as any[]).push({
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { code: searchRegex },
      { category: searchRegex }
    ]
  });
}

if (status && type !== 'public') {
  // Don't override status filter for public rooms
  query.status = status;
}

if (category) {
  query.category = category;
}

if (difficulty) {
  query.difficulty = difficulty;
}


    // Add filters
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Execute query
    const rooms = await db.collection('rooms')
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('rooms').countDocuments(query);

    // Format response
    const formattedRooms = rooms.map(room => ({
      id: room._id.toString(),
      code: room.code,
      title: room.title,
      description: room.description,
      status: room.status,
      currentParticipants: room.currentParticipants,
      maxParticipants: room.maxParticipants,
      creatorName: room.creatorName,
      category: room.category,
      difficulty: room.difficulty,
      timeLimit: room.timeLimit,
      isPublic: room.isPublic,
      allowLateJoin: room.allowLateJoin,
      showLeaderboard: room.showLeaderboard,
      scheduledStartTime: room.scheduledStartTime,
      createdAt: room.createdAt,
      startedAt: room.startedAt,
      completedAt: room.completedAt,
      statistics: room.statistics,
    }));

    return NextResponse.json({
      success: true,
      rooms: formattedRooms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    console.error("Get rooms error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}


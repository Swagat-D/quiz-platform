// app/api/rooms/code/[code]/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

interface RouteParams {
  params: {
    code: string;
  };
}

// GET room by code
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { code } = params;
    
    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: "Invalid room code" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const room = await db.collection('rooms').findOne({ 
      code: code.toUpperCase() 
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      room: {
        id: room._id.toString(),
        code: room.code,
        title: room.title,
        description: room.description,
        status: room.status,
        currentParticipants: room.currentParticipants,
        maxParticipants: room.maxParticipants,
        creatorName: room.creatorName,
        allowLateJoin: room.allowLateJoin,
        isPublic: room.isPublic,
        category: room.category,
        difficulty: room.difficulty,
        timeLimit: room.timeLimit,
        scheduledStartTime: room.scheduledStartTime,
      }
    });

  } catch (error) {
    console.error("Get room by code error:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}
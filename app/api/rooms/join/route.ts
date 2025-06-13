// app/api/rooms/join/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDb } from "@/lib/mongodb";

interface JoinRoomRequest {
  roomCode: string;
  userName?: string; // For guest users
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body: JoinRoomRequest = await req.json();
    
    if (!body.roomCode) {
      return NextResponse.json(
        { error: "Room code is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Find the room
    const room = await db.collection('rooms').findOne({ 
      code: body.roomCode.toUpperCase() 
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Check room status
    if (room.status === 'completed') {
      return NextResponse.json(
        { error: "This room has already ended" },
        { status: 400 }
      );
    }

    if (room.status === 'cancelled') {
      return NextResponse.json(
        { error: "This room has been cancelled" },
        { status: 400 }
      );
    }

    if (room.status === 'active' && !room.allowLateJoin) {
      return NextResponse.json(
        { error: "This room has already started and doesn't allow late joining" },
        { status: 400 }
      );
    }

    // Check if room is full
    if (room.currentParticipants >= room.maxParticipants) {
      return NextResponse.json(
        { error: "Room is full" },
        { status: 400 }
      );
    }

    const userId = session?.user?.id;
    const userName = session?.user?.name || body.userName || `Guest_${Date.now()}`;
    const userEmail = session?.user?.email;

    // Check if user is already in the room
    const existingParticipant = room.participants?.find((p: any) => 
      p.userId === userId || (p.email === userEmail && userEmail)
    );

    if (existingParticipant) {
      return NextResponse.json(
        { error: "You are already in this room" },
        { status: 400 }
      );
    }

    // Add participant to room
    const participant = {
      userId: userId || null,
      userName: userName,
      email: userEmail || null,
      isAuthenticated: !!session,
      joinedAt: new Date(),
      isActive: true,
      score: 0,
      answeredQuestions: 0,
      lastActivity: new Date(),
    };

    await db.collection('rooms').updateOne(
      { _id: room._id },
      { 
        $push: { participants: participant },
        $inc: { currentParticipants: 1 },
        $set: { updatedAt: new Date() }
      }
    );

    // Create activity log
    await db.collection('roomActivities').insertOne({
      roomId: room._id.toString(),
      roomCode: room.code,
      userId: userId,
      userName: userName,
      action: 'user_joined',
      details: {
        isAuthenticated: !!session,
        joinMethod: session ? 'authenticated' : 'guest',
      },
      timestamp: new Date(),
    });

    // Get updated room data
    const updatedRoom = await db.collection('rooms').findOne({ _id: room._id });

    if (!updatedRoom) {
      return NextResponse.json(
        { error: "Failed to retrieve updated room information" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      room: {
        id: updatedRoom._id.toString(),
        code: updatedRoom.code,
        title: updatedRoom.title,
        description: updatedRoom.description,
        status: updatedRoom.status,
        currentParticipants: updatedRoom.currentParticipants,
        maxParticipants: updatedRoom.maxParticipants,
        creatorName: updatedRoom.creatorName,
        allowLateJoin: updatedRoom.allowLateJoin,
        showLeaderboard: updatedRoom.showLeaderboard,
        timeLimit: updatedRoom.timeLimit,
        settings: updatedRoom.settings,
      },
      participant: {
        userName: userName,
        isAuthenticated: !!session,
        joinedAt: participant.joinedAt,
      }
    });

  } catch (error) {
    console.error("Join room error:", error);
    return NextResponse.json(
      { error: "Failed to join room" },
      { status: 500 }
    );
  }
}

// GET endpoint to check room status before joining
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomCode = searchParams.get('code');

    if (!roomCode) {
      return NextResponse.json(
        { error: "Room code is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const room = await db.collection('rooms').findOne({ 
      code: roomCode.toUpperCase() 
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
    console.error("Get room info error:", error);
    return NextResponse.json(
      { error: "Failed to get room information" },
      { status: 500 }
    );
  }
}
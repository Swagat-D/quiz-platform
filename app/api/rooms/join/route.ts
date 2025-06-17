// app/api/rooms/join/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDb } from "@/lib/mongodb";

interface JoinRoomRequest {
  roomCode: string;
  userName?: string; // For guest users
}

// Fix the room join API to handle case-insensitive search
// Update app/api/rooms/join/route.ts POST method:

export async function POST(req: Request) {
  try {
    console.log('Join room API called');
    
    const session = await getServerSession(authOptions);
    const body: JoinRoomRequest = await req.json();
    
    console.log('Request body:', body);
    
    if (!body.roomCode) {
      console.log('Missing room code');
      return NextResponse.json(
        { error: "Room code is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Use case-insensitive search for room codes
    console.log('Looking for room with code (case-insensitive):', body.roomCode);
    const room = await db.collection('rooms').findOne({ 
      code: { $regex: new RegExp(`^${body.roomCode}$`, 'i') }
    });

    if (!room) {
      console.log('Room not found for code:', body.roomCode);
      return NextResponse.json(
        { error: "Room not found. Please check the room code and try again." },
        { status: 404 }
      );
    }

    console.log('Found room:', room.title, 'Status:', room.status, 'Stored code:', room.code);

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
      console.log('User already in room, returning existing room data');
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
          showLeaderboard: room.showLeaderboard,
          timeLimit: room.timeLimit,
          settings: room.settings,
        },
        participant: {
          userName: existingParticipant.userName,
          isAuthenticated: existingParticipant.isAuthenticated,
          joinedAt: existingParticipant.joinedAt,
        }
      });
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

    console.log('Adding participant:', participant.userName);

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

    console.log('Successfully joined room');

    return NextResponse.json({
      success: true,
      room: {
        id: room._id.toString(),
        code: room.code,
        title: room.title,
        description: room.description,
        status: room.status,
        currentParticipants: room.currentParticipants + 1,
        maxParticipants: room.maxParticipants,
        creatorName: room.creatorName,
        allowLateJoin: room.allowLateJoin,
        showLeaderboard: room.showLeaderboard,
        timeLimit: room.timeLimit,
        settings: room.settings,
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
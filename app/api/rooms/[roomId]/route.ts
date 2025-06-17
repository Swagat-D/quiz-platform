// app/api/rooms/[roomId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface RouteParams {
  params: {
    roomId: string;
  };
}

// GET single room
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { roomId } = await params;
    
    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { error: "Invalid room ID" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const room = await db.collection('rooms').findOne({ 
      _id: new ObjectId(roomId) 
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
        creatorId: room.creatorId,
        creatorName: room.creatorName,
        participants: room.participants,
        settings: room.settings,
        statistics: room.statistics,
        isPublic: room.isPublic,
        allowLateJoin: room.allowLateJoin,
        showLeaderboard: room.showLeaderboard,
        shuffleQuestions: room.shuffleQuestions,
        category: room.category,
        difficulty: room.difficulty,
        timeLimit: room.timeLimit,
        scheduledStartTime: room.scheduledStartTime,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        startedAt: room.startedAt,
        completedAt: room.completedAt,
      }
    });

  } catch (error) {
    console.error("Get room error:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}

// PUT - Update room
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { roomId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { error: "Invalid room ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const db = await getDb();

    // Check if user owns the room
    const room = await db.collection('rooms').findOne({ 
      _id: new ObjectId(roomId),
      creatorId: session.user.id 
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found or unauthorized" },
        { status: 404 }
      );
    }

    // Prevent updates if room is active or completed
    if (room.status === 'active' || room.status === 'completed') {
      return NextResponse.json(
        { error: "Cannot update room that is active or completed" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update allowed fields
    const allowedFields = [
      'title', 'description', 'maxParticipants', 'timeLimit', 
      'isPublic', 'allowLateJoin', 'showLeaderboard', 'shuffleQuestions',
      'category', 'difficulty', 'scheduledStartTime', 'settings'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Update room
    await db.collection('rooms').updateOne(
      { _id: new ObjectId(roomId) },
      { $set: updateData }
    );

    // Log activity
    await db.collection('roomActivities').insertOne({
      roomId: roomId,
      roomCode: room.code,
      userId: session.user.id,
      userName: session.user.name,
      action: 'room_updated',
      details: updateData,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Update room error:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

// DELETE - Delete room
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { roomId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { error: "Invalid room ID" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if user owns the room
    const room = await db.collection('rooms').findOne({ 
      _id: new ObjectId(roomId),
      creatorId: session.user.id 
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found or unauthorized" },
        { status: 404 }
      );
    }

    // Can only delete rooms that haven't started or are completed
    if (room.status === 'active' || room.status === 'paused') {
      return NextResponse.json(
        { error: "Cannot delete active room. Please end the room first." },
        { status: 400 }
      );
    }

    // Delete related data first
    await Promise.all([
      // Delete room questions
      db.collection('roomQuestions').deleteMany({ roomId: roomId }),
      // Delete participant answers
      db.collection('participantAnswers').deleteMany({ roomId: roomId }),
      // Delete room activities
      db.collection('roomActivities').deleteMany({ roomId: roomId }),
      // Delete room sessions
      db.collection('roomSessions').deleteMany({ roomId: roomId })
    ]);

    // Finally delete the room itself
    const deleteResult = await db.collection('rooms').deleteOne({ 
      _id: new ObjectId(roomId) 
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete room" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Room deleted successfully" 
    });

  } catch (error) {
    console.error("Delete room error:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
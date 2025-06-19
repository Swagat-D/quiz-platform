// app/api/rooms/create/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDb } from "@/lib/mongodb";
import { generateRoomCode } from "@/utils/generate-room-code";

interface CreateRoomRequest {
  title: string;
  description?: string;
  maxParticipants: number;
  timeLimit?: number; // in minutes
  isPublic: boolean;
  allowLateJoin: boolean;
  showLeaderboard: boolean;
  shuffleQuestions: boolean;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  scheduledStartTime?: Date;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: CreateRoomRequest = await req.json();
    
    // Validate required fields
    if (!body.title || body.maxParticipants < 1 || body.maxParticipants > 1000) {
      return NextResponse.json(
        { error: "Invalid room configuration" },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Generate unique room code
    let roomCode: string;
    let isUnique = false;
    let attempts = 0;
    
    do {
      roomCode = generateRoomCode();
      const existingRoom = await db.collection('rooms').findOne({ code: roomCode });
      isUnique = !existingRoom;
      attempts++;
      
      if (attempts > 10) {
        throw new Error("Failed to generate unique room code");
      }
    } while (!isUnique);

    // Create room document
    const roomData = {
      code: roomCode,
      title: body.title,
      description: body.description || "",
      creatorId: session.user.id,
      creatorName: session.user.name,
      maxParticipants: body.maxParticipants,
      currentParticipants: 0,
      timeLimit: body.timeLimit,
      isPublic: body.isPublic,
      allowLateJoin: body.allowLateJoin,
      showLeaderboard: body.showLeaderboard,
      shuffleQuestions: body.shuffleQuestions,
      category: body.category,
      difficulty: body.difficulty,
      scheduledStartTime: body.scheduledStartTime ? new Date(body.scheduledStartTime) : null,
      status: 'waiting', // waiting, active, completed, cancelled
      participants: [],
      settings: {
        allowChat: true,
        allowQuestionSkip: false,
        showCorrectAnswers: true,
        instantFeedback: true,
      },
      statistics: {
        totalQuestions: 0,
        averageScore: 0,
        completionRate: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: null,
      completedAt: null,
    };

    const result = await db.collection('rooms').insertOne(roomData);

    // Create activity log
    await db.collection('roomActivities').insertOne({
      roomId: result.insertedId.toString(),
      roomCode: roomCode,
      userId: session.user.id,
      userName: session.user.name,
      action: 'room_created',
      details: {
        title: body.title,
        maxParticipants: body.maxParticipants,
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      room: {
        id: result.insertedId.toString(),
        code: roomCode,
        title: body.title,
        description: body.description,
        maxParticipants: body.maxParticipants,
        isPublic: body.isPublic,
        status: 'waiting',
        createdAt: roomData.createdAt,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Create room error:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
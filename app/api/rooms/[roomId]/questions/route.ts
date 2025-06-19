/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/rooms/[roomId]/questions/route.ts
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

// GET room questions
export async function GET(req: Request, { params }: RouteParams) {
  try {
    //const session = await getServerSession(authOptions);
    const { roomId } = await params;
    
    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { error: "Invalid room ID" },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Check if user has access to this room
    const room = await db.collection('rooms').findOne({ 
      _id: new ObjectId(roomId) 
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Get room questions
    const roomQuestions = await db.collection('roomQuestions')
      .find({ roomId: roomId })
      .sort({ order: 1 })
      .toArray();

    if (roomQuestions.length === 0) {
      return NextResponse.json({
        success: true,
        questions: []
      });
    }

    // Get full question details
    const questionIds = roomQuestions.map(rq => new ObjectId(rq.questionId));
    const questions = await db.collection('questions')
      .find({ _id: { $in: questionIds } })
      .toArray();

    // Combine room question data with full question details
    const formattedQuestions = roomQuestions.map(rq => {
      const question = questions.find(q => q._id.toString() === rq.questionId);
      if (!question) return null;

      return {
        id: question._id.toString(),
        title: question.title,
        content: question.content,
        options: question.options,
        correctAnswer: question.correctAnswer,
        difficulty: question.difficulty,
        category: question.category,
        explanation: question.explanation,
        timeLimit: rq.timeLimit || question.timeLimit,
        points: rq.points || question.points,
        order: rq.order,
        isRequired: rq.isRequired || false,
        createdAt: question.createdAt
      };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      questions: formattedQuestions
    });

  } catch (error) {
    console.error("Get room questions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch room questions" },
      { status: 500 }
    );
  }
}

// POST - Add questions to room
export async function POST(req: Request, { params }: RouteParams) {
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
    const { questionIds, replaceAll = false } = body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid question IDs" },
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

    // Can't modify questions if room is active or completed
    if (room.status === 'active' || room.status === 'completed') {
      return NextResponse.json(
        { error: "Cannot modify questions in active or completed rooms" },
        { status: 400 }
      );
    }

    // Validate that all question IDs exist and user has access
    const questions = await db.collection('questions').find({
      _id: { $in: questionIds.map((id: string) => new ObjectId(id)) },
      $or: [
        { creatorId: session.user.id },
        { isPublic: true }
      ]
    }).toArray();

    if (questions.length !== questionIds.length) {
      return NextResponse.json(
        { error: "Some questions not found or not accessible" },
        { status: 400 }
      );
    }

    // If replaceAll, remove existing questions
    if (replaceAll) {
      await db.collection('roomQuestions').deleteMany({ roomId: roomId });
    }

    // Get current max order
    const maxOrderResult = await db.collection('roomQuestions')
      .findOne({ roomId: roomId }, { sort: { order: -1 } });
    
    const nextOrder = maxOrderResult ? maxOrderResult.order + 1 : 1;

    // Add new questions
    const roomQuestionDocs = questionIds.map((questionId: string, index: number) => ({
      roomId: roomId,
      questionId: questionId,
      order: replaceAll ? index + 1 : nextOrder + index,
      isRequired: true,
      timeLimit: null, // Use question default
      points: null, // Use question default
      addedAt: new Date(),
      addedBy: session.user.id
    }));

    await db.collection('roomQuestions').insertMany(roomQuestionDocs);

    // Update room statistics
    const totalQuestions = await db.collection('roomQuestions').countDocuments({ roomId: roomId });
    await db.collection('rooms').updateOne(
      { _id: new ObjectId(roomId) },
      { 
        $set: { 
          'statistics.totalQuestions': totalQuestions,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({ 
      success: true,
      totalQuestions: totalQuestions
    });

  } catch (error) {
    console.error("Add room questions error:", error);
    return NextResponse.json(
      { error: "Failed to add questions to room" },
      { status: 500 }
    );
  }
}

// PUT - Update question order or settings
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
    const { questions } = body; // Array of { questionId, order, timeLimit?, points? }

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Invalid questions data" },
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

    // Can't modify questions if room is active or completed
    if (room.status === 'active' || room.status === 'completed') {
      return NextResponse.json(
        { error: "Cannot modify questions in active or completed rooms" },
        { status: 400 }
      );
    }

    // Update each question
    for (const questionUpdate of questions) {
      const updateData: any = {
        order: questionUpdate.order,
        updatedAt: new Date()
      };

      if (questionUpdate.timeLimit !== undefined) {
        updateData.timeLimit = questionUpdate.timeLimit;
      }
      if (questionUpdate.points !== undefined) {
        updateData.points = questionUpdate.points;
      }

      await db.collection('roomQuestions').updateOne(
        { 
          roomId: roomId,
          questionId: questionUpdate.questionId 
        },
        { $set: updateData }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Update room questions error:", error);
    return NextResponse.json(
      { error: "Failed to update room questions" },
      { status: 500 }
    );
  }
}

// DELETE - Remove questions from room
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

    const { searchParams } = new URL(req.url);
    const questionIds = searchParams.get('questionIds')?.split(',') || [];

    if (questionIds.length === 0) {
      return NextResponse.json(
        { error: "No question IDs provided" },
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

    // Can't modify questions if room is active or completed
    if (room.status === 'active' || room.status === 'completed') {
      return NextResponse.json(
        { error: "Cannot modify questions in active or completed rooms" },
        { status: 400 }
      );
    }

    // Remove questions from room
    await db.collection('roomQuestions').deleteMany({
      roomId: roomId,
      questionId: { $in: questionIds }
    });

    // Update room statistics
    const totalQuestions = await db.collection('roomQuestions').countDocuments({ roomId: roomId });
    await db.collection('rooms').updateOne(
      { _id: new ObjectId(roomId) },
      { 
        $set: { 
          'statistics.totalQuestions': totalQuestions,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({ 
      success: true,
      totalQuestions: totalQuestions
    });

  } catch (error) {
    console.error("Remove room questions error:", error);
    return NextResponse.json(
      { error: "Failed to remove questions from room" },
      { status: 500 }
    );
  }
}
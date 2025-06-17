// app/api/questions/[questionId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface RouteParams {
  params: {
    questionId: string;
  };
}

// GET single question
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { questionId } = params;
    
    if (!ObjectId.isValid(questionId)) {
      return NextResponse.json(
        { error: "Invalid question ID" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const question = await db.collection('questions').findOne({ 
      _id: new ObjectId(questionId) 
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      question: {
        id: question._id.toString(),
        title: question.title,
        content: question.content,
        options: question.options,
        correctAnswer: question.correctAnswer,
        difficulty: question.difficulty,
        category: question.category,
        explanation: question.explanation,
        timeLimit: question.timeLimit,
        points: question.points,
        tags: question.tags,
        creatorName: question.creatorName,
        isPublic: question.isPublic,
        usage: question.usage,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt
      }
    });

  } catch (error) {
    console.error("Get question error:", error);
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 }
    );
  }
}

// PUT - Update question
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { questionId } = params;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(questionId)) {
      return NextResponse.json(
        { error: "Invalid question ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const db = await getDb();

    // Check if user owns the question
    const question = await db.collection('questions').findOne({ 
      _id: new ObjectId(questionId),
      creatorId: session.user.id 
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found or unauthorized" },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.title || !body.content || !body.options || body.options.length < 2) {
      return NextResponse.json(
        { error: "Missing required fields or insufficient options" },
        { status: 400 }
      );
    }

    if (body.correctAnswer < 0 || body.correctAnswer >= body.options.length) {
      return NextResponse.json(
        { error: "Invalid correct answer index" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      title: body.title.trim(),
      content: body.content.trim(),
      options: body.options.map((opt: string) => opt.trim()),
      correctAnswer: body.correctAnswer,
      difficulty: body.difficulty || question.difficulty,
      category: body.category || question.category,
      explanation: body.explanation?.trim(),
      timeLimit: body.timeLimit || question.timeLimit,
      points: body.points || question.points,
      tags: body.tags || question.tags,
      isPublic: body.isPublic !== undefined ? body.isPublic : question.isPublic,
      updatedAt: new Date()
    };

    // Update question
    await db.collection('questions').updateOne(
      { _id: new ObjectId(questionId) },
      { $set: updateData }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Update question error:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

// DELETE - Delete question
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { questionId } = params;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(questionId)) {
      return NextResponse.json(
        { error: "Invalid question ID" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if user owns the question
    const question = await db.collection('questions').findOne({ 
      _id: new ObjectId(questionId),
      creatorId: session.user.id 
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if question is being used in any active rooms
    const activeRoomsUsingQuestion = await db.collection('roomQuestions').findOne({
      questionId: questionId,
      'room.status': { $in: ['waiting', 'active'] }
    });

    if (activeRoomsUsingQuestion) {
      return NextResponse.json(
        { error: "Cannot delete question that is being used in active rooms" },
        { status: 400 }
      );
    }

    // Delete the question
    await db.collection('questions').deleteOne({ _id: new ObjectId(questionId) });

    // Remove question from any room question sets
    await db.collection('roomQuestions').deleteMany({ questionId: questionId });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete question error:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
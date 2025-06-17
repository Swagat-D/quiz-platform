// app/api/questions/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface Question {
  _id?: ObjectId;
  title: string;
  content: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  explanation?: string;
  timeLimit?: number;
  points?: number;
  tags?: string[];
  creatorId: string;
  creatorName: string;
  isPublic: boolean;
  usage: number;
  createdAt: Date;
  updatedAt: Date;
}

// GET - List questions
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const type = searchParams.get('type') || 'my'; // 'my', 'public', 'all'

    const db = await getDb();
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    // Build query based on type
    if (type === 'my' && session?.user?.id) {
      query.creatorId = session.user.id;
    } else if (type === 'public') {
      query.isPublic = true;
    } else if (type === 'all' && session?.user?.id) {
      query.$or = [
        { creatorId: session.user.id },
        { isPublic: true }
      ];
    } else if (!session?.user?.id) {
      // For unauthenticated users, only show public questions
      query.isPublic = true;
    }

    // Add filters
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Execute query
    const questions = await db.collection('questions')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('questions').countDocuments(query);

    // Format response
    const formattedQuestions = questions.map(question => ({
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
      updatedAt: question.updatedAt,
      canEdit: session?.user?.id === question.creatorId
    }));

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
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
    console.error("Get questions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

// POST - Create question
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    
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

    const db = await getDb();

    // Create question document
    const questionData: Omit<Question, '_id'> = {
      title: body.title.trim(),
      content: body.content.trim(),
      options: body.options.map((opt: string) => opt.trim()),
      correctAnswer: body.correctAnswer,
      difficulty: body.difficulty || 'medium',
      category: body.category || 'General',
      explanation: body.explanation?.trim(),
      timeLimit: body.timeLimit || 30,
      points: body.points || 1,
      tags: body.tags || [],
      creatorId: session.user.id,
      creatorName: session.user.name || 'Anonymous',
      isPublic: body.isPublic || false,
      usage: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('questions').insertOne(questionData);

    return NextResponse.json({
      success: true,
      question: {
        id: result.insertedId.toString(),
        ...questionData
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Create question error:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}
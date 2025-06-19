/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/rooms/[roomId]/results/route.ts
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


// GET - Get quiz results
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { roomId } = await params;
    
    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { error: "Invalid room ID" },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Get room details
    const room = await db.collection('rooms').findOne({ 
      _id: new ObjectId(roomId) 
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Check if room is completed or if user has permission to view results
    const userId = session?.user?.id;
    const guestId = req.headers.get('guest-id'); // You might pass this in header
    
    const isCreator = room.creatorId === userId;
    const isParticipant = room.participants?.some((p: any) => 
      p.userId === userId || p.userName === guestId
    );

    if (!isCreator && !isParticipant && room.status !== 'completed') {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get all participant answers
    const participantAnswers = await db.collection('participantAnswers')
      .find({ roomId: roomId })
      .toArray();

    // Get room questions
    const roomQuestions = await db.collection('roomQuestions')
      .find({ roomId: roomId })
      .sort({ order: 1 })
      .toArray();

    // Get full question details
    const questionIds = roomQuestions.map(rq => new ObjectId(rq.questionId));
    const questions = await db.collection('questions')
      .find({ _id: { $in: questionIds } })
      .toArray();

    // Process participant results
    const participantStats = new Map();
    
    participantAnswers.forEach(answer => {
      const participantId = answer.participantId;
      if (!participantStats.has(participantId)) {
        participantStats.set(participantId, {
          totalQuestions: 0,
          correctAnswers: 0,
          totalPoints: 0,
          timeSpent: 0,
          answers: []
        });
      }
      
      const stats = participantStats.get(participantId);
      stats.totalQuestions++;
      if (answer.isCorrect) stats.correctAnswers++;
      stats.totalPoints += answer.points || 0;
      stats.timeSpent += answer.timeSpent || 0;
      stats.answers.push(answer);
      participantStats.set(participantId, stats);
    });

    // Create participant results with rankings
    const participantResults = room.participants.map((participant: any) => {
      const stats = participantStats.get(participant.userId || participant.userName) || {
        totalQuestions: 0,
        correctAnswers: 0,
        totalPoints: 0,
        timeSpent: 0,
        answers: []
      };

      const score = stats.totalQuestions > 0 ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0;
      const accuracy = stats.totalQuestions > 0 ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0;

      return {
        id: participant.userId || participant.userName,
        userName: participant.userName,
        email: participant.email,
        isAuthenticated: participant.isAuthenticated,
        score: score,
        answeredQuestions: stats.totalQuestions,
        totalQuestions: roomQuestions.length,
        timeSpent: stats.timeSpent,
        accuracy: accuracy,
        rank: 0, // Will be calculated below
        badges: [] // Can be populated based on achievements
      };
    });

    // Sort by score and assign ranks
    participantResults.sort((a: {
      id: string;
      userName: string;
      email: string;
      isAuthenticated: boolean;
      score: number;
      answeredQuestions: number;
      totalQuestions: number;
      timeSpent: number;
      accuracy: number;
      rank: number;
      badges: any[];
    }, b: {
      id: string;
      userName: string;
      email: string;
      isAuthenticated: boolean;
      score: number;
      answeredQuestions: number;
      totalQuestions: number;
      timeSpent: number;
      accuracy: number;
      rank: number;
      badges: any[];
    }) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return a.timeSpent - b.timeSpent; // Faster time wins if score and accuracy are same
    });

    participantResults.forEach((participant: {
      id: string;
      userName: string;
      email: string;
      isAuthenticated: boolean;
      score: number;
      answeredQuestions: number;
      totalQuestions: number;
      timeSpent: number;
      accuracy: number;
      rank: number;
      badges: any[];
    }, index: number) => {
      participant.rank = index + 1;
    });

    // Process question results
    const questionResults = roomQuestions.map(rq => {
      const question = questions.find(q => q._id.toString() === rq.questionId);
      if (!question) return null;

      const questionAnswers = participantAnswers.filter(answer => answer.questionId === rq.questionId);
      const correctAnswers = questionAnswers.filter(answer => answer.isCorrect).length;
      const totalAttempts = questionAnswers.length;
      const correctRate = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
      const averageTime = totalAttempts > 0 
        ? Math.round(questionAnswers.reduce((sum, answer) => sum + (answer.timeSpent || 0), 0) / totalAttempts)
        : 0;

      return {
        id: question._id.toString(),
        title: question.title,
        category: question.category,
        difficulty: question.difficulty,
        correctRate: correctRate,
        averageTime: averageTime,
        totalAttempts: totalAttempts
      };
    }).filter(Boolean);

    // Calculate overall statistics
    const totalParticipants = participantResults.length;
    const completedParticipants = participantResults.filter((p: any) => p.answeredQuestions > 0).length;
    const averageScore = totalParticipants > 0 
      ? Math.round(participantResults.reduce((sum:number, p:any) => sum + p.score, 0) / totalParticipants) 
      : 0;
    const completionRate = totalParticipants > 0 
      ? Math.round((completedParticipants / totalParticipants) * 100) 
      : 0;
    const highestScore = participantResults.length > 0 ? participantResults[0].score : 0;
    const lowestScore = participantResults.length > 0 
      ? participantResults[participantResults.length - 1].score 
      : 0;
    const averageTime = participantResults.length > 0
      ? Math.round(participantResults.reduce((sum: number, p: any) => sum + p.timeSpent, 0) / participantResults.length)
      : 0;

    const results = {
      id: room._id.toString(),
      code: room.code,
      title: room.title,
      description: room.description,
      category: room.category,
      difficulty: room.difficulty,
      status: room.status,
      creatorName: room.creatorName,
      participants: participantResults,
      questionResults: questionResults,
      statistics: {
        totalQuestions: roomQuestions.length,
        averageScore: averageScore,
        completionRate: completionRate,
        totalParticipants: totalParticipants,
        averageTime: averageTime,
        highestScore: highestScore,
        lowestScore: lowestScore
      },
      startedAt: room.startedAt,
      completedAt: room.completedAt,
      timeLimit: room.timeLimit
    };

    return NextResponse.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error("Get results error:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}

// POST - Export results (for future implementation)
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
    const { format } = body; // 'csv', 'pdf', 'excel'

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

    // TODO: Implement export functionality
    // This would generate CSV, PDF, or Excel files with the results
    
    return NextResponse.json({
      success: true,
      message: "Export functionality will be implemented",
      format: format
    });

  } catch (error) {
    console.error("Export results error:", error);
    return NextResponse.json(
      { error: "Failed to export results" },
      { status: 500 }
    );
  }
}
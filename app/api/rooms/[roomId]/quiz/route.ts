// app/api/rooms/[roomId]/quiz/route.ts
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

// GET - Get quiz questions for participant
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { roomId } = params;
    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get('participantId');
    
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

    // Check if room is accessible
    if (room.status === 'completed' || room.status === 'cancelled') {
      return NextResponse.json(
        { error: "This quiz has ended" },
        { status: 400 }
      );
    }

    if (room.status === 'waiting') {
      return NextResponse.json(
        { error: "Quiz hasn't started yet" },
        { status: 400 }
      );
    }

    // Verify participant
    const userId = session?.user?.id;
    const isParticipant = room.participants?.some((p: any) => 
      p.userId === userId || p.userName === participantId
    );

    if (!isParticipant && room.creatorId !== userId) {
      return NextResponse.json(
        { error: "You are not a participant in this room" },
        { status: 403 }
      );
    }

    // Get room questions
    const roomQuestions = await db.collection('roomQuestions')
      .find({ roomId: roomId })
      .sort({ order: 1 })
      .toArray();

    if (roomQuestions.length === 0) {
      return NextResponse.json(
        { error: "No questions found for this quiz" },
        { status: 404 }
      );
    }

    // Get full question details
    const questionIds = roomQuestions.map(rq => new ObjectId(rq.questionId));
    const questions = await db.collection('questions')
      .find({ _id: { $in: questionIds } })
      .toArray();

    // Get participant's existing answers
    const participantAnswers = await db.collection('participantAnswers')
      .find({ 
        roomId: roomId,
        participantId: userId || participantId
      })
      .toArray();

    const answerMap = new Map();
    participantAnswers.forEach(answer => {
      answerMap.set(answer.questionId, answer);
    });

    // Format questions for participant (hide correct answers)
    const formattedQuestions = roomQuestions.map((rq, index) => {
      const question = questions.find(q => q._id.toString() === rq.questionId);
      if (!question) return null;

      const existingAnswer = answerMap.get(rq.questionId);

      return {
        id: question._id.toString(),
        questionNumber: index + 1,
        title: question.title,
        content: question.content,
        options: question.options,
        timeLimit: rq.timeLimit || question.timeLimit || room.timeLimit || 30,
        points: rq.points || question.points || 1,
        difficulty: question.difficulty,
        category: question.category,
        // Don't send correct answer to participant
        selectedAnswer: existingAnswer?.selectedAnswer ?? null,
        answeredAt: existingAnswer?.answeredAt ?? null,
        timeSpent: existingAnswer?.timeSpent ?? null,
        isCorrect: existingAnswer?.isCorrect ?? null
      };
    }).filter(Boolean);

    // Calculate progress
    const totalQuestions = formattedQuestions.length;
    const answeredQuestions = participantAnswers.length;
    const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

    return NextResponse.json({
      success: true,
      room: {
        id: room._id.toString(),
        code: room.code,
        title: room.title,
        status: room.status,
        timeLimit: room.timeLimit,
        showLeaderboard: room.showLeaderboard,
        settings: room.settings
      },
      questions: formattedQuestions,
      progress: {
        answered: answeredQuestions,
        total: totalQuestions,
        percentage: progress
      },
      timeRemaining: room.scheduledEndTime ? 
        Math.max(0, new Date(room.scheduledEndTime).getTime() - Date.now()) : null
    });

  } catch (error) {
    console.error("Get quiz questions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz questions" },
      { status: 500 }
    );
  }
}

// POST - Submit answer
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { roomId } = params;
    
    const body = await req.json();
    const { questionId, selectedAnswer, timeSpent, participantId } = body;

    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { error: "Invalid room ID" },
        { status: 400 }
      );
    }

    if (!questionId || selectedAnswer === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Check if room is active
    if (room.status !== 'active') {
      return NextResponse.json(
        { error: "Quiz is not active" },
        { status: 400 }
      );
    }

    // Verify participant
    const userId = session?.user?.id || participantId;
    const participant = room.participants?.find((p: any) => 
      p.userId === userId || p.userName === participantId
    );

    if (!participant && room.creatorId !== userId) {
      return NextResponse.json(
        { error: "You are not a participant in this room" },
        { status: 403 }
      );
    }

    // Get question details
    const question = await db.collection('questions').findOne({ 
      _id: new ObjectId(questionId) 
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Check if answer is correct
    const isCorrect = selectedAnswer === question.correctAnswer;
    const points = isCorrect ? (question.points || 1) : 0;

    // Save/update participant answer
    const answerData = {
      roomId: roomId,
      questionId: questionId,
      participantId: userId,
      selectedAnswer: selectedAnswer,
      isCorrect: isCorrect,
      points: points,
      timeSpent: timeSpent || 0,
      answeredAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('participantAnswers').replaceOne(
      { 
        roomId: roomId,
        questionId: questionId,
        participantId: userId 
      },
      answerData,
      { upsert: true }
    );

    // Update participant stats in room
    const participantAnswers = await db.collection('participantAnswers')
      .find({ roomId: roomId, participantId: userId })
      .toArray();

    const totalScore = participantAnswers.reduce((sum, answer) => sum + answer.points, 0);
    const answeredCount = participantAnswers.length;

    await db.collection('rooms').updateOne(
      { 
        _id: new ObjectId(roomId),
        'participants.userId': userId 
      },
      {
        $set: {
          'participants.$.score': totalScore,
          'participants.$.answeredQuestions': answeredCount,
          'participants.$.lastActivity': new Date()
        }
      }
    );

    // If guest participant, update by name
    if (!session?.user?.id) {
      await db.collection('rooms').updateOne(
        { 
          _id: new ObjectId(roomId),
          'participants.userName': participantId 
        },
        {
          $set: {
            'participants.$.score': totalScore,
            'participants.$.answeredQuestions': answeredCount,
            'participants.$.lastActivity': new Date()
          }
        }
      );
    }

    // Return feedback based on room settings
    const response: any = {
      success: true,
      submitted: true
    };

    if (room.settings?.instantFeedback) {
      response.isCorrect = isCorrect;
      response.points = points;
    }

    if (room.settings?.showCorrectAnswers) {
      response.correctAnswer = question.correctAnswer;
      response.explanation = question.explanation;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("Submit answer error:", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}
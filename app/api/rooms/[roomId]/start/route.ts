// app/api/rooms/[roomId]/start/route.ts
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

// POST - Start room
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

    // Can only start waiting rooms
    if (room.status !== 'waiting') {
      return NextResponse.json(
        { error: "Room can only be started from waiting status" },
        { status: 400 }
      );
    }

    // Check if room has questions
    const questionCount = await db.collection('roomQuestions').countDocuments({ roomId: roomId });
    if (questionCount === 0) {
      return NextResponse.json(
        { error: "Cannot start room without questions" },
        { status: 400 }
      );
    }

    // Start the room
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (room.timeLimit * 60 * 1000));

    await db.collection('rooms').updateOne(
      { _id: new ObjectId(roomId) },
      { 
        $set: { 
          status: 'active',
          startedAt: startTime,
          scheduledEndTime: endTime,
          updatedAt: startTime
        } 
      }
    );

    // Create room session for tracking
    await db.collection('roomSessions').insertOne({
      roomId: roomId,
      roomCode: room.code,
      startedBy: session.user.id,
      startedAt: startTime,
      scheduledEndTime: endTime,
      participantSessions: [],
      currentQuestion: 0,
      questionStartTime: null,
      isActive: true,
      settings: room.settings,
      totalQuestions: questionCount
    });

    // Initialize participant sessions for existing participants
    if (room.participants && room.participants.length > 0) {
      const participantSessions = room.participants.map((participant: any) => ({
        participantId: participant.userId || participant.userName,
        userName: participant.userName,
        joinedAt: participant.joinedAt,
        currentQuestion: 0,
        score: 0,
        answeredQuestions: 0,
        isActive: true,
        lastActivity: startTime
      }));

      await db.collection('roomSessions').updateOne(
        { roomId: roomId },
        { $set: { participantSessions } }
      );
    }

    // Log activity
    await db.collection('roomActivities').insertOne({
      roomId: roomId,
      roomCode: room.code,
      userId: session.user.id,
      userName: session.user.name,
      action: 'room_started',
      details: {
        startTime: startTime,
        endTime: endTime,
        questionCount: questionCount,
        participantCount: room.currentParticipants
      },
      timestamp: startTime,
    });

    return NextResponse.json({
      success: true,
      room: {
        id: roomId,
        status: 'active',
        startedAt: startTime,
        scheduledEndTime: endTime,
        questionCount: questionCount
      }
    });

  } catch (error) {
    console.error("Start room error:", error);
    return NextResponse.json(
      { error: "Failed to start room" },
      { status: 500 }
    );
  }
}

// PUT - Control room (pause, resume, end)
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
    const { action } = body; // 'pause', 'resume', 'end'

    if (!['pause', 'resume', 'end'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
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

    // Can only control active or paused rooms
    if (!['active', 'paused'].includes(room.status)) {
      return NextResponse.json(
        { error: "Room must be active or paused to control" },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    let activityAction = '';
    
    switch (action) {
      case 'pause':
        if (room.status !== 'active') {
          return NextResponse.json(
            { error: "Room must be active to pause" },
            { status: 400 }
          );
        }
        updateData.status = 'paused';
        updateData.pausedAt = new Date();
        activityAction = 'room_paused';
        
        // Update room session
        await db.collection('roomSessions').updateOne(
          { roomId: roomId },
          { 
            $set: { 
              isPaused: true,
              pausedAt: new Date()
            } 
          }
        );
        break;
        
      case 'resume':
        if (room.status !== 'paused') {
          return NextResponse.json(
            { error: "Room must be paused to resume" },
            { status: 400 }
          );
        }
        updateData.status = 'active';
        updateData.resumedAt = new Date();
        updateData.$unset = { pausedAt: "" };
        activityAction = 'room_resumed';
        
        // Update room session
        await db.collection('roomSessions').updateOne(
          { roomId: roomId },
          { 
            $set: { 
              isPaused: false,
              resumedAt: new Date()
            },
            $unset: { pausedAt: "" }
          }
        );
        break;
        
      case 'end':
        updateData.status = 'completed';
        updateData.completedAt = new Date();
        activityAction = 'room_ended';
        
        // Calculate final statistics
        const participants = room.participants || [];
        const totalParticipants = participants.length;
        
        // Get all participant answers to calculate statistics
        const participantAnswers = await db.collection('participantAnswers')
          .find({ roomId: roomId })
          .toArray();
        
        // Calculate completion rate and average score
        const participantScores = new Map();
        let totalScore = 0;
        let completedParticipants = 0;
        
        participantAnswers.forEach(answer => {
          const participantId = answer.participantId;
          if (!participantScores.has(participantId)) {
            participantScores.set(participantId, { score: 0, answered: 0 });
          }
          const stats = participantScores.get(participantId);
          stats.score += answer.points;
          stats.answered += 1;
          participantScores.set(participantId, stats);
        });
        
        // Calculate averages
        const questionCount = await db.collection('roomQuestions').countDocuments({ roomId: roomId });
        participantScores.forEach((stats, participantId) => {
          if (stats.answered > 0) {
            completedParticipants++;
            totalScore += (stats.score / questionCount) * 100; // Convert to percentage
          }
        });
        
        const averageScore = completedParticipants > 0 ? Math.round(totalScore / completedParticipants) : 0;
        const completionRate = totalParticipants > 0 ? Math.round((completedParticipants / totalParticipants) * 100) : 0;
        
        updateData['statistics.averageScore'] = averageScore;
        updateData['statistics.completionRate'] = completionRate;
        updateData['statistics.totalQuestions'] = questionCount;
        
        // Update room session
        await db.collection('roomSessions').updateOne(
          { roomId: roomId },
          { 
            $set: { 
              isActive: false,
              endedAt: new Date(),
              endedBy: session.user.id,
              finalStatistics: {
                averageScore,
                completionRate,
                totalParticipants,
                completedParticipants,
                totalQuestions: questionCount
              }
            } 
          }
        );
        
        // Update participant final scores in room
        for (const [participantId, stats] of participantScores) {
          const finalScore = questionCount > 0 ? Math.round((stats.score / questionCount) * 100) : 0;
          
          await db.collection('rooms').updateOne(
            { 
              _id: new ObjectId(roomId),
              'participants.userId': participantId 
            },
            {
              $set: {
                'participants.$.score': finalScore,
                'participants.$.answeredQuestions': stats.answered,
                'participants.$.completedAt': new Date()
              }
            }
          );
          
          // Also update by userName for guest participants
          await db.collection('rooms').updateOne(
            { 
              _id: new ObjectId(roomId),
              'participants.userName': participantId 
            },
            {
              $set: {
                'participants.$.score': finalScore,
                'participants.$.answeredQuestions': stats.answered,
                'participants.$.completedAt': new Date()
              }
            }
          );
        }
        break;
    }

    // Update room
    const updateOperations: any = { $set: updateData };
    if (updateData.$unset) {
      updateOperations.$unset = updateData.$unset;
      delete updateData.$unset;
    }

    await db.collection('rooms').updateOne(
      { _id: new ObjectId(roomId) },
      updateOperations
    );

    // Log activity
    await db.collection('roomActivities').insertOne({
      roomId: roomId,
      roomCode: room.code,
      userId: session.user.id,
      userName: session.user.name,
      action: activityAction,
      details: { 
        action,
        timestamp: new Date(),
        ...(action === 'end' && {
          finalStatistics: updateData['statistics.averageScore'] ? {
            averageScore: updateData['statistics.averageScore'],
            completionRate: updateData['statistics.completionRate'],
            totalQuestions: updateData['statistics.totalQuestions']
          } : {}
        })
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      room: {
        id: roomId,
        status: updateData.status,
        updatedAt: updateData.updatedAt,
        ...(action === 'end' && {
          statistics: {
            averageScore: updateData['statistics.averageScore'],
            completionRate: updateData['statistics.completionRate'],
            totalQuestions: updateData['statistics.totalQuestions']
          }
        })
      }
    });

  } catch (error) {
    console.error("Control room error:", error);
    return NextResponse.json(
      { error: "Failed to control room" },
      { status: 500 }
    );
  }
}

// GET - Get room status for live updates
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

    // Get room session if active
    const roomSession = await db.collection('roomSessions').findOne({ 
      roomId: roomId 
    });

    // Calculate time remaining
    let timeRemaining = null;
    if (room.status === 'active' && room.scheduledEndTime) {
      timeRemaining = Math.max(0, new Date(room.scheduledEndTime).getTime() - Date.now());
    }

    return NextResponse.json({
      success: true,
      room: {
        id: room._id.toString(),
        code: room.code,
        title: room.title,
        status: room.status,
        currentParticipants: room.currentParticipants,
        maxParticipants: room.maxParticipants,
        startedAt: room.startedAt,
        scheduledEndTime: room.scheduledEndTime,
        completedAt: room.completedAt,
        timeRemaining: timeRemaining,
        statistics: room.statistics,
        participants: room.participants || []
      },
      session: roomSession ? {
        currentQuestion: roomSession.currentQuestion,
        questionStartTime: roomSession.questionStartTime,
        isActive: roomSession.isActive,
        isPaused: roomSession.isPaused || false,
        totalQuestions: roomSession.totalQuestions
      } : null
    });

  } catch (error) {
    console.error("Get room status error:", error);
    return NextResponse.json(
      { error: "Failed to get room status" },
      { status: 500 }
    );
  }
}
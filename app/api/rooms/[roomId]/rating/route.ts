// app/api/rooms/[roomId]/rating/route.ts
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

// Define a Participant interface for type safety
interface Participant {
  userId?: string;
  userName?: string;
  [key: string]: unknown;
}

// POST - Submit rating for a room
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { roomId } = await params;
    
    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { error: "Invalid room ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { rating } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
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

    // Determine user identifier
    const userId = session?.user?.id;
    const guestId = !session ? `guest_${Date.now()}` : null;
    const userIdentifier = userId || guestId;

    if (!userIdentifier) {
      return NextResponse.json(
        { error: "User identification required" },
        { status: 400 }
      );
    }

    // Check if user already rated this room
    const existingRating = await db.collection('roomRatings').findOne({
      roomId: roomId,
      userId: userIdentifier
    });

    if (existingRating) {
      return NextResponse.json(
        { error: "You have already rated this room" },
        { status: 400 }
      );
    }

    // Verify user participated in the room
    const isParticipant = room.participants?.some((p: Participant) => 
      p.userId === userId || (!session && p.userName)
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: "Only participants can rate this room" },
        { status: 403 }
      );
    }

    // Save rating
    const ratingData = {
      roomId: roomId,
      userId: userIdentifier,
      userName: session?.user?.name || 'Anonymous',
      rating: rating,
      createdAt: new Date(),
      isAuthenticated: !!session
    };

    await db.collection('roomRatings').insertOne(ratingData);

    // Update room statistics with new rating
    const allRatings = await db.collection('roomRatings')
      .find({ roomId: roomId })
      .toArray();

    const averageRating = allRatings.length > 0 
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length 
      : 0;

    await db.collection('rooms').updateOne(
      { _id: new ObjectId(roomId) },
      { 
        $set: { 
          'statistics.averageRating': Math.round(averageRating * 10) / 10,
          'statistics.totalRatings': allRatings.length,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
      rating: rating,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: allRatings.length
    });

  } catch (error) {
    console.error("Submit rating error:", error);
    return NextResponse.json(
      { error: "Failed to submit rating" },
      { status: 500 }
    );
  }
}

// GET - Get ratings for a room
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

    // Get all ratings for this room
    const ratings = await db.collection('roomRatings')
      .find({ roomId: roomId })
      .sort({ createdAt: -1 })
      .toArray();

    // Calculate statistics
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
      : 0;

    // Count ratings by star
    const ratingDistribution = {
      5: ratings.filter(r => r.rating === 5).length,
      4: ratings.filter(r => r.rating === 4).length,
      3: ratings.filter(r => r.rating === 3).length,
      2: ratings.filter(r => r.rating === 2).length,
      1: ratings.filter(r => r.rating === 1).length,
    };

    return NextResponse.json({
      success: true,
      statistics: {
        totalRatings: totalRatings,
        averageRating: Math.round(averageRating * 10) / 10,
        distribution: ratingDistribution
      },
      ratings: ratings.map(rating => ({
        id: rating._id.toString(),
        userName: rating.userName,
        rating: rating.rating,
        createdAt: rating.createdAt,
        isAuthenticated: rating.isAuthenticated
      }))
    });

  } catch (error) {
    console.error("Get ratings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ratings" },
      { status: 500 }
    );
  }
}
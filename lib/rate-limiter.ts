import { getDb } from './mongodb';

interface RateLimitRecord {
  ip: string;
  endpoint: string;
  count: number;
  timestamp: Date;
}

/**
 * Simple rate limiting implementation using MongoDB
 * Tracks requests by IP and endpoint
 */
export async function rateLimit(
  ip: string,
  endpoint: string,
  maxRequests: number = 5,
  windowMs: number = 60 * 60 * 1000 // 1 hour window by default
): Promise<{ success: boolean; limit: number; remaining: number; resetTime: Date }> {
  const db = await getDb();
  const rateLimits = db.collection('rateLimits');
  
  // Calculate the window start time
  const windowStart = new Date(Date.now() - windowMs);
  
  // Find existing rate limit record for this IP and endpoint
  const record = await rateLimits.findOne<RateLimitRecord>({
    ip,
    endpoint,
    timestamp: { $gte: windowStart }
  });
  
  if (!record) {
    // No record found or record is outside the window - create a new one
    await rateLimits.insertOne({
      ip,
      endpoint,
      count: 1,
      timestamp: new Date()
    });
    
    // Return success with info
    const resetTime = new Date(Date.now() + windowMs);
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1, 
      resetTime
    };
  }
  
  // Record exists and is within the window
  if (record.count >= maxRequests) {
    // Rate limit exceeded
    const resetTime = new Date(record.timestamp.getTime() + windowMs);
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetTime
    };
  }
  
  // Update the existing record
  await rateLimits.updateOne(
    { _id: record._id },
    { $inc: { count: 1 } }
  );
  
  // Calculate reset time
  const resetTime = new Date(record.timestamp.getTime() + windowMs);
  
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - (record.count + 1),
    resetTime
  };
}

/**
 * Helper function to format a rate limit error response
 */
export function formatRateLimitResponse(resetTime: Date): string {
  const now = new Date();
  const diffMs = resetTime.getTime() - now.getTime();
  const diffMins = Math.ceil(diffMs / 60000); // Convert to minutes
  
  return `Rate limit exceeded. Please try again in ${diffMins} minute${diffMins !== 1 ? 's' : ''}.`;
}
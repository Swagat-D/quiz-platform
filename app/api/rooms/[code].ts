import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;

  if (typeof code !== 'string') {
    return res.status(400).json({ message: 'Invalid room code' });
  }

  const db = await getDb();
  const room = await db.collection('rooms').findOne({ code });

  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  // Get questions for this room
  const questions = await db.collection('questions')
    .find({ roomId: room._id.toString() })
    .toArray();

  // Add questions to room object
  const roomWithQuestions = {
    ...room,
    questions
  };

  res.status(200).json(roomWithQuestions);
}
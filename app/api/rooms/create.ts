import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/mongodb';
import { generateRoomCode } from '@/utils/generate-room-code'; // Adjust path as needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = req.body; // Assume userId comes from auth middleware/session

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  let roomCode;
  let isUnique = false;
  
  const db = await getDb();
  
  do {
    roomCode = generateRoomCode();
    const existingRoom = await db.collection('rooms').findOne({ code: roomCode });
    isUnique = !existingRoom;
  } while (!isUnique);

  /*const room = await db.collection('rooms').insertOne({
    code: roomCode,
    creatorId: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  });*/

  res.status(201).json({ roomCode });
}
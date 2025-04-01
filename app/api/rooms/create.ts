import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { generateRoomCode } from '@/utils/roomCode'; // Adjust path as needed

const prisma = new PrismaClient();

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
  do {
    roomCode = generateRoomCode();
    const existingRoom = await prisma.room.findUnique({ where: { code: roomCode } });
    isUnique = !existingRoom;
  } while (!isUnique);

  const room = await prisma.room.create({
    data: {
      code: roomCode,
      creatorId: userId,
    },
  });

  res.status(201).json({ roomCode: room.code });
}
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;

  if (typeof code !== 'string') {
    return res.status(400).json({ message: 'Invalid room code' });
  }

  const room = await prisma.room.findUnique({
    where: { code },
    include: { questions: true },
  });

  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  res.status(200).json(room);
}
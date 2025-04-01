import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;

  if (typeof code !== 'string') {
    return res.status(400).json({ message: 'Invalid room code' });
  }

  const room = await prisma.room.findUnique({ where: { code } });
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  if (req.method === 'GET') {
    const questions = await prisma.question.findMany({
      where: { roomId: room.id },
    });
    res.status(200).json(questions);
  } else if (req.method === 'POST') {
    const { questions } = req.body; // Array of { text, options, correctOption }
    const createdQuestions = await prisma.question.createMany({
      data: questions.map((q: any) => ({
        roomId: room.id,
        text: q.text,
        options: q.options,
        correctOption: q.correctOption,
      })),
    });
    res.status(201).json(createdQuestions);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
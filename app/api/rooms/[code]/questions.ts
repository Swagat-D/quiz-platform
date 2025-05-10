import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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

  if (req.method === 'GET') {
    const questions = await db.collection('questions')
      .find({ roomId: room._id.toString() })
      .toArray();
      
    res.status(200).json(questions);
  } else if (req.method === 'POST') {
    const { questions } = req.body; // Array of { text, options, correctOption }
    
    interface Question {
      text: string;
      options: string[];
      correctOption: number;
    }

    const questionDocs = questions.map((q: Question) => ({
      roomId: room._id.toString(),
      text: q.text,
      options: q.options,
      correctOption: q.correctOption,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const result = await db.collection('questions').insertMany(questionDocs);
    
    res.status(201).json({
      acknowledged: result.acknowledged,
      insertedCount: result.insertedCount
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
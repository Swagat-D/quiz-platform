import { getDb } from './mongodb';

interface ContactFormSubmission {
  name: string;
  email: string;
  message: string;
  ipAddress: string;
  userAgent?: string;
  createdAt: Date;
  status: 'sent' | 'failed';
  emailSentTo?: string[];
  errorMessage?: string;
  isAuthenticated?: boolean;
  userId?: string;
}

/**
 * Tracks contact form submissions in the database
 */
export async function trackContactFormSubmission(
  data: Omit<ContactFormSubmission, 'createdAt'>
): Promise<string> {
  const db = await getDb();
  const formSubmissions = db.collection('contactFormSubmissions');
  
  // Insert the submission with timestamp
  const result = await formSubmissions.insertOne({
    ...data,
    createdAt: new Date()
  });
  
  return result.insertedId.toString();
}

/**
 * Updates the status of a form submission
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: 'sent' | 'failed',
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  const formSubmissions = db.collection('contactFormSubmissions');
  
  const updateData: Partial<ContactFormSubmission> = { status };
  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }
  
  await formSubmissions.updateOne(
    { _id: new ObjectId(submissionId) },
    { $set: updateData }
  );
}

// Import ObjectId
import { ObjectId } from 'mongodb';
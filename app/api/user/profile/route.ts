import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDb } from '@/lib/mongodb';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const username = formData.get('username') as string;
    //const avatar = formData.get('avatar') as File;
    
    // In a real implementation, you would upload avatar to a storage service 
    // like AWS S3, Cloudinary, etc. and get a URL back
    // For this example, we'll skip actual file upload
    
    // Update user in database
    const db = await getDb();
    await db.collection('users').updateOne(
      { email: session.user.email as string },
      { 
        $set: { 
          name: username,
          updatedAt: new Date()
          // If you had an avatar URL from upload service, you'd add it here
        } 
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
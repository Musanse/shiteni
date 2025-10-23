import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

export async function checkVendorApproval(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return { 
        authorized: false, 
        error: 'Authentication required' 
      };
    }

    await connectDB();
    
    const user = await User.findById(session.user.id).select('role status').lean();
    
    if (!user) {
      return { 
        authorized: false, 
        error: 'User not found' 
      };
    }

    // Check if user is a vendor (manager role)
    if (user.role !== 'manager') {
      return { 
        authorized: false, 
        error: 'Vendor access required' 
      };
    }

    // Check if vendor is approved (active status)
    if (user.status !== 'active') {
      return { 
        authorized: false, 
        error: 'Vendor approval required. Please wait for admin approval to list products.' 
      };
    }

    return { 
      authorized: true, 
      user: user 
    };
  } catch (error) {
    console.error('Error checking vendor approval:', error);
    return { 
      authorized: false, 
      error: 'Authorization check failed' 
    };
  }
}

export async function requireVendorApproval(request: Request) {
  const result = await checkVendorApproval(request);
  
  if (!result.authorized) {
    return {
      success: false,
      error: result.error,
      status: 403
    };
  }
  
  return {
    success: true,
    user: result.user
  };
}

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

// Hash password
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Create JWT token
export async function createToken(payload) {
  // Convert permissions array to JSON string for JWT compatibility
  const tokenPayload = {
    ...payload,
    permissions: JSON.stringify(payload.permissions || [])
  };

  return await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

// Verify JWT token
export async function verifyToken(token) {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload;
    
    // Parse permissions back to array
    return {
      ...payload,
      permissions: JSON.parse(payload.permissions || '[]')
    };
  } catch (error) {
    return null;
  }
}

// Get user from request
export async function getUserFromRequest(request) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) return null;
  
  return await verifyToken(token);
}
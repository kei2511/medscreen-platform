import { useState, useEffect } from 'react';
import jwt_decode from 'jwt-decode';
import { getAuthToken } from './auth';

interface DecodedToken {
  doctorId: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export function useRole() {
  const [role, setRole] = useState<'ADMIN' | 'USER' | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      try {
        const decoded = jwt_decode(token) as DecodedToken;
        setRole(decoded.role);
      } catch (error) {
        console.error('Error decoding token:', error);
        setRole(null);
      }
    } else {
      setRole(null);
    }
  }, []);

  return {
    role,
    isAdmin: role === 'ADMIN',
    isUser: role === 'USER',
  };
}
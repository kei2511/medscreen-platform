import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
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
    if (!token) {
      setRole(null);
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      if (decoded && (decoded.role === 'ADMIN' || decoded.role === 'USER')) {
        setRole(decoded.role);
      } else {
        console.error('Invalid role in token:', decoded);
        setRole(null);
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      setRole(null);
    }
  }, []);

  return {
    role,
    isAdmin: role === 'ADMIN',
    isUser: role === 'USER',
  };
}
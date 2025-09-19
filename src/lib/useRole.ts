import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getAuthToken } from './auth';

interface DecodedToken {
  doctorId?: string;
  respondentId?: string;
  email: string;
  role: 'DOCTOR' | 'RESPONDENT' | 'ADMIN' | 'USER';
  appRole?: 'ADMIN' | 'USER';
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
      const effective = decoded.appRole || (decoded.role === 'ADMIN' || decoded.role === 'USER' ? decoded.role : undefined);
      if (effective === 'ADMIN' || effective === 'USER') {
        setRole(effective);
      } else {
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
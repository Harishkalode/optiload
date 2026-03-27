import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function Users() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/users/management', { replace: true });
  }, [navigate]);

  return null;
}
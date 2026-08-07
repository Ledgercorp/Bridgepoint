import React from 'react';
import { MemoryRouter } from 'react-router-dom';

interface TestRouterProps {
  children: React.ReactNode;
  initialEntries?: string[];
}

export function TestRouter({ children, initialEntries = ['/'] }: TestRouterProps) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );
}

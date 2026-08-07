/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactElement } from 'react';
import * as RTL from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TestRouter } from './mocks/router';
import { Toaster } from '../src/components/ui/toaster';

// Cast to get proper types
const { render: rtlRender, screen, fireEvent, waitFor, within, act, cleanup, renderHook } = RTL as any;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

interface AllTheProvidersProps {
  children: React.ReactNode;
  initialEntries?: string[];
}

function AllTheProviders({ children, initialEntries }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <TestRouter initialEntries={initialEntries}>
        {children}
        <Toaster />
      </TestRouter>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions {
  initialEntries?: string[];
  [key: string]: any;
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { initialEntries, ...renderOptions } = options || {};
  return rtlRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <AllTheProviders initialEntries={initialEntries}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

export { customRender as render, screen, fireEvent, waitFor, within, act, cleanup, renderHook };

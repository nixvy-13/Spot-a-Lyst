'use client';
import { type Metadata } from 'next'
import {ClerkProvider} from '@clerk/nextjs'
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
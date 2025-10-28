import { ReactNode } from 'react';

export interface FloatingElementProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  left?: string;
  top?: string;
}
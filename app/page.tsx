'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useMemo, useState } from 'react';
import Dashboard from '@/components/Dashboard';

export default function Page() {
  return <Dashboard />;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/server/auth';

export default async function HomePage() {
  const session = await getServerAuthSession({} as any);
  
  if (session) {
    redirect('/chat');
  } else {
    redirect('/auth/signin');
  }
}
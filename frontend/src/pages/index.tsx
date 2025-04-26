import { useEffect } from 'react';
import { useRouter } from 'next/router';
import "../app/globals.css";
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl">Redirecting to login...</h1>
      </div>
    </div>
  );
}
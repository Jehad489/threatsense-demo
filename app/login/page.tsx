'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('admin@email.com');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (email === 'admin@email.com' && password === 'admin') {
      window.location.href = '/';
      
    } else {
      setError('Invalid email or password. Please use admin@email.com / admin.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 text-foreground">
            <Shield className="h-6 w-6 text-[#DC2626]" />
            <h1 className="text-lg font-semibold">ThreatSense | Insider Threat Detection</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Sign in as Analyst to access the dashboard.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-muted-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="analyst@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-muted-foreground">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {error && <p className="text-sm text-[#F87171]">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Starting Demo...' : 'Start Demo'}
          </Button>
        </form>
      </div>
    </div>
  );
}

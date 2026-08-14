import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider.js";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Card, CardBody } from "../../components/ui/Card.js";

export function LoginPage() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      navigate("/app");
    } catch {
      setError("Couldn't sign in. Check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await signInWithGoogle();
      navigate("/app");
    } catch {
      setError("Google sign-in failed. Try again.");
    }
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <Button type="button" variant="secondary" className="w-full" onClick={() => void handleGoogle()}>
          Continue with Google
        </Button>
        <div className="flex items-center gap-3 text-xs text-ink-400">
          <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
          or
          <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="text-center text-sm text-ink-500 dark:text-ink-400">
          New to believe.ai?{" "}
          <Link to="/signup" className="font-medium text-brand-600">
            Create an account
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}

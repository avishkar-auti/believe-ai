import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider.js";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Card, CardBody } from "../../components/ui/Card.js";

export function SignupPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
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
      await signUpWithEmail(email, password);
      navigate("/app");
    } catch {
      setError("Couldn't create your account. Try a different email or a stronger password.");
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
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="text-center text-sm text-ink-500 dark:text-ink-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600">
            Sign in
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Check, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider.js";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { GoogleIcon } from "./GoogleIcon.js";
import { cn } from "../../lib/cn.js";

const fieldStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fieldItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

export function SignupPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordValid = password.length >= 6;

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
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate("/app");
    } catch {
      setError("Google sign-in failed. Try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <motion.div initial="hidden" animate="show" variants={fieldStagger}>
      <motion.div variants={fieldItem}>
        <Card className="shadow-lift">
          <CardBody className="space-y-5">
            <motion.div variants={fieldItem}>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => void handleGoogle()}
                disabled={googleLoading}
              >
                <GoogleIcon className="h-4 w-4" />
                {googleLoading ? "Connecting…" : "Continue with Google"}
              </Button>
            </motion.div>

            <motion.div variants={fieldItem} className="flex items-center gap-3 text-xs text-ink-400">
              <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
              or
              <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
            </motion.div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <motion.div variants={fieldItem} className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300 dark:text-ink-600" />
                <Input
                  type="email"
                  placeholder="Email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </motion.div>

              <motion.div variants={fieldItem}>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300 dark:text-ink-600" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 transition-colors hover:text-ink-600 dark:text-ink-600 dark:hover:text-ink-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p
                  className={cn(
                    "mt-1.5 flex items-center gap-1.5 text-xs transition-colors",
                    password.length === 0
                      ? "text-ink-400"
                      : passwordValid
                        ? "text-lime-600 dark:text-lime-400"
                        : "text-ink-400",
                  )}
                >
                  {passwordValid && <Check className="h-3 w-3" />}
                  At least 6 characters
                </p>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 overflow-hidden rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={fieldItem}>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </motion.div>
            </form>

            <motion.p variants={fieldItem} className="text-center text-sm text-ink-500 dark:text-ink-400">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Sign in
              </Link>
            </motion.p>
          </CardBody>
        </Card>
      </motion.div>
    </motion.div>
  );
}

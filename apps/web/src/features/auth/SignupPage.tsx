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
import { AuthShell } from "./AuthShell.js";
import { AuthHeroPanel } from "./AuthHeroPanel.js";
import { ProductPreviewCard } from "./ProductPreviewCard.js";
import { AUTH_PREVIEW_CARDS } from "./authPreviewData.js";

const fieldStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
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
    <AuthShell
      hero={
        <AuthHeroPanel
          heading={
            <>
              One workspace for
              <br />
              everything you&rsquo;re
              <br />
              working toward.
            </>
          }
          paragraph="AI tools, smart workflows, and real opportunities — all in one place."
        />
      }
      preview={AUTH_PREVIEW_CARDS.map((card, i) => (
        <ProductPreviewCard key={card.key} card={card} index={i} />
      ))}
    >
      <Card className="shadow-lift">
        <CardBody className="space-y-5">
          <motion.div initial="hidden" animate="show" variants={fieldStagger}>
            <motion.div variants={fieldItem}>
              <h2 className="text-[20px] font-semibold text-fg">Create your account</h2>
              <p className="mt-1 text-[13px] text-fg-subtle">Get started in less than a minute.</p>
            </motion.div>

            <motion.div variants={fieldItem} className="mt-5">
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

            <motion.div variants={fieldItem} className="mt-5 flex items-center gap-3 text-xs text-fg-subtle">
              <div className="h-px flex-1 bg-line" />
              or
              <div className="h-px flex-1 bg-line" />
            </motion.div>

            <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
              <motion.div variants={fieldItem} className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
                <Input
                  type="email"
                  placeholder="Email address"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </motion.div>

              <motion.div variants={fieldItem}>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
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
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-subtle transition-colors hover:text-fg"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p
                  className={cn(
                    "mt-1.5 flex items-center gap-1.5 text-xs transition-colors",
                    password.length === 0 ? "text-fg-subtle" : passwordValid ? "text-positive" : "text-fg-subtle",
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
                    className="flex items-start gap-2 overflow-hidden rounded-xl bg-critical/10 px-3 py-2.5 text-sm text-critical"
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

            <motion.p variants={fieldItem} className="mt-5 text-center text-sm text-fg-subtle">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
                Sign in
              </Link>
            </motion.p>
          </motion.div>
        </CardBody>
      </Card>
    </AuthShell>
  );
}

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider.js";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { GoogleIcon } from "./GoogleIcon.js";
import { AuthShell } from "./AuthShell.js";
import { AuthHeroPanel } from "./AuthHeroPanel.js";
import { LoginPreviewPanel } from "./LoginPreviewPanel.js";

const fieldStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};

const fieldItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

const swap = {
  hidden: { opacity: 0, x: 10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.2 } },
};

export function LoginPage() {
  const { signInWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [mode, setMode] = useState<"signin" | "reset" | "reset-sent">("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

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

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setMode("reset-sent");
    } catch {
      setResetError("Couldn't send a reset link. Check the email and try again.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <AuthShell
      hero={
        <AuthHeroPanel
          heading={<>Welcome back! 👋</>}
          showStatement={false}
          paragraph="Good to see you again. Let's keep your momentum going."
        >
          <LoginPreviewPanel />
        </AuthHeroPanel>
      }
    >
      <Card className="shadow-lift">
        <CardBody className="space-y-5">
          <AnimatePresence mode="wait">
            {mode === "signin" && (
              <motion.div key="signin" initial="hidden" animate="show" exit="exit" variants={swap}>
                <motion.div variants={fieldStagger} initial="hidden" animate="show">
                  <motion.div variants={fieldItem}>
                    <h2 className="text-[20px] font-semibold text-fg">Sign in to your account</h2>
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

                    <motion.div variants={fieldItem} className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="pl-10 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
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
                    </motion.div>

                    <motion.div variants={fieldItem} className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email);
                          setResetError(null);
                          setMode("reset");
                        }}
                        className="text-xs font-medium text-accent hover:text-accent-hover"
                      >
                        Forgot password?
                      </button>
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
                        {loading ? "Signing in…" : "Sign in"}
                      </Button>
                    </motion.div>
                  </form>

                  <motion.p variants={fieldItem} className="mt-5 text-center text-sm text-fg-subtle">
                    New to believe.ai?{" "}
                    <Link to="/signup" className="font-medium text-accent hover:text-accent-hover">
                      Create an account
                    </Link>
                  </motion.p>
                </motion.div>
              </motion.div>
            )}

            {mode === "reset" && (
              <motion.div key="reset" initial="hidden" animate="show" exit="exit" variants={swap}>
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="flex items-center gap-1.5 text-xs font-medium text-fg-subtle hover:text-fg"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </button>

                <h2 className="mt-3 text-[20px] font-semibold text-fg">Reset your password</h2>
                <p className="mt-1 text-[13px] text-fg-subtle">
                  We&rsquo;ll email you a link to get back into your account.
                </p>

                <form className="mt-5 space-y-3" onSubmit={handleReset}>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      className="pl-10"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <AnimatePresence>
                    {resetError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 overflow-hidden rounded-xl bg-critical/10 px-3 py-2.5 text-sm text-critical"
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {resetError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button type="submit" className="w-full" size="lg" disabled={resetLoading}>
                    {resetLoading ? "Sending…" : "Send reset link"}
                  </Button>
                </form>
              </motion.div>
            )}

            {mode === "reset-sent" && (
              <motion.div key="reset-sent" initial="hidden" animate="show" exit="exit" variants={swap} className="text-center">
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-positive/10 text-positive"
                >
                  <CheckCircle2 className="h-5 w-5" />
                </motion.span>
                <h2 className="mt-3 text-[18px] font-semibold text-fg">Check your email</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-fg-subtle">
                  If an account exists for {resetEmail}, a reset link is on its way.
                </p>
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="mt-5 text-sm font-medium text-accent hover:text-accent-hover"
                >
                  Back to sign in
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardBody>
      </Card>
    </AuthShell>
  );
}

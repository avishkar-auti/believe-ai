import { motion } from "framer-motion";
import { Lightbulb, User } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export function AboutYouStep({
  name,
  company,
  about,
  onNameChange,
  onCompanyChange,
  onAboutChange,
  onBack,
  onNext,
}: {
  name: string;
  company: string;
  about: string;
  onNameChange: (v: string) => void;
  onCompanyChange: (v: string) => void;
  onAboutChange: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <motion.div initial="hidden" animate="show" variants={container} className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <motion.div variants={item}>
          <h1 className="text-[26px] font-semibold tracking-tight text-fg">Tell us about yourself</h1>
          <p className="mt-1.5 text-[14px] text-fg-subtle">This helps us personalize your experience across believe.ai.</p>
        </motion.div>

        <div className="mt-6 space-y-4">
          <motion.label variants={item} className="block text-sm font-medium text-fg">
            Your name
            <Input className="mt-1.5" value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Sam Believer" />
          </motion.label>

          <motion.label variants={item} className="block text-sm font-medium text-fg">
            Company <span className="font-normal text-fg-subtle">(optional)</span>
            <Input className="mt-1.5" value={company} onChange={(e) => onCompanyChange(e.target.value)} />
          </motion.label>

          <motion.label variants={item} className="block text-sm font-medium text-fg">
            A short bio about you
            <Textarea
              className="mt-1.5"
              rows={4}
              value={about}
              onChange={(e) => onAboutChange(e.target.value)}
              placeholder="Backend engineer with 3+ years of Node.js experience passionate about building scalable products."
              maxLength={160}
            />
            <span className="mt-1 block text-right text-[11px] text-fg-subtle">{about.length}/160</span>
          </motion.label>
        </div>

        <motion.div variants={item} className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onBack}>
            Back
          </Button>
          <Button className="flex-1" onClick={onNext}>
            Continue
          </Button>
        </motion.div>
      </div>

      <motion.div variants={item} className="space-y-4">
        <div className="rounded-card border border-line bg-surface p-5 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Profile preview</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <User className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-fg">{name || "Your name"}</p>
              {company && <p className="truncate text-[13px] text-fg-subtle">{company}</p>}
            </div>
          </div>
          {about && <p className="mt-3 text-[13px] leading-relaxed text-fg-subtle">{about}</p>}
        </div>

        <div className="flex items-start gap-2.5 rounded-card bg-accent-soft/60 p-4">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="text-[13px] leading-relaxed text-fg">You can always update this later in your settings.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

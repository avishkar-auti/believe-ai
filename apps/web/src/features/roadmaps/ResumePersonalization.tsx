import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FileUp } from "lucide-react";
import type { Resume } from "@believe-ai/shared";
import { ResumeSelector } from "../career-fit/ResumeSelector.js";

export function ResumePersonalization({
  personalize,
  onPersonalizeChange,
  resumes,
  selectedResumeId,
  onSelectResume,
}: {
  personalize: boolean;
  onPersonalizeChange: (value: boolean) => void;
  resumes: Resume[] | undefined;
  selectedResumeId: string | undefined;
  onSelectResume: (id: string) => void;
}) {
  const hasResumes = Boolean(resumes && resumes.length > 0);

  return (
    <div>
      <label className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={personalize}
          disabled={!hasResumes}
          onChange={(e) => onPersonalizeChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded accent-accent disabled:cursor-not-allowed"
        />
        <span>
          <span className="block text-sm font-medium text-fg">Personalize using my resume</span>
          <span className="block text-caption text-fg-subtle">We'll use your existing skills to skip what you already know.</span>
        </span>
      </label>

      <AnimatePresence initial={false}>
        {personalize && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="ml-[26px] mt-2.5">
              {hasResumes ? (
                <div className="max-w-xs">
                  <ResumeSelector resumes={resumes ?? []} selectedResumeId={selectedResumeId} onSelect={onSelectResume} />
                </div>
              ) : (
                <Link to="/app/resume" className="flex w-fit items-center gap-1.5 text-caption font-medium text-accent hover:underline">
                  <FileUp className="h-3.5 w-3.5" /> Upload a resume to personalize
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

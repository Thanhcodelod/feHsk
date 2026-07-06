"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Lightbulb, Info } from "lucide-react";
import type { SubmissionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Shown below a question once it has been graded. Displays the correct/incorrect
 * banner, the grader's feedback, the model answer and the pedagogical
 * explanation (all in Vietnamese).
 */
export function FeedbackPanel({ result }: { result: SubmissionResult | null }) {
  return (
    <AnimatePresence>
      {result ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div
            className={cn(
              "rounded-xl border-2 p-4",
              result.isCorrect
                ? "border-success/40 bg-success/5"
                : "border-destructive/40 bg-destructive/5"
            )}
          >
            <div className="flex items-center gap-2">
              {result.isCorrect ? (
                <CheckCircle2 className="size-6 text-success" />
              ) : (
                <XCircle className="size-6 text-destructive" />
              )}
              <span
                className={cn(
                  "text-lg font-bold",
                  result.isCorrect ? "text-success" : "text-destructive"
                )}
              >
                {result.isCorrect ? "Chính xác!" : "Chưa đúng"}
              </span>
              {typeof result.score === "number" ? (
                <span className="ml-auto rounded-full bg-card px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
                  Điểm: {Math.round(result.score * 100)}%
                </span>
              ) : null}
            </div>

            {result.feedback ? (
              <p className="mt-2 text-sm">{result.feedback}</p>
            ) : null}

            {result.correctAnswer &&
            result.correctAnswer !== "Câu trả lời mở" ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-card p-3">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Đáp án
                  </p>
                  <p className="hanzi mt-0.5 text-base font-medium">
                    {result.correctAnswer}
                  </p>
                </div>
              </div>
            ) : null}

            {result.explanation ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-accent/10 p-3">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">
                    Giải thích
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed">
                    {result.explanation}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

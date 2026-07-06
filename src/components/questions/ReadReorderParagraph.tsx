"use client";

// READ_REORDER_PARAGRAPH — arrange scrambled sentences into a coherent paragraph.
// options = Option[] (sentences, in original/correct order). We shuffle ONCE on
// mount for display. Answer = JSON string[] of ids in the current order; because
// every item is always present the answer is reported on every reorder (and
// immediately on mount) and never becomes null. Review coloring derives only
// from `result.breakdown`, keyed by the item's current index.

import * as React from "react";
import type { Option, QuestionComponentProps } from "@/lib/types";
import { PinyinText } from "@/components/practice/PinyinText";
import { QuestionPrompt } from "@/components/practice/QuestionPrompt";
import { SortableList } from "@/components/practice/SortableList";
import { shuffleClient } from "@/lib/utils";

export function ReadReorderParagraph({
  question,
  onAnswerChange,
  result,
  showPinyin,
  showTranslation,
}: QuestionComponentProps) {
  const sentences = React.useMemo(
    () => (question.options as Option[]) ?? [],
    [question.options]
  );
  const locked = result !== null;

  // Shuffle once (stable across re-renders) for the initial display order.
  const [order, setOrder] = React.useState<Option[]>(() =>
    shuffleClient(sentences)
  );

  // Report the initial order immediately, and on every reorder afterwards.
  React.useEffect(() => {
    onAnswerChange(JSON.stringify(order.map((o) => o.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const handleReorder = (next: Option[]) => {
    if (locked) return;
    setOrder(next);
  };

  const itemState = (index: number): "idle" | "correct" | "incorrect" => {
    if (!locked || !result?.breakdown) return "idle";
    return result.breakdown[String(index)] ? "correct" : "incorrect";
  };

  return (
    <div className="space-y-5">
      <QuestionPrompt>{question.questionText}</QuestionPrompt>

      <p className="text-sm text-muted-foreground">
        Kéo hoặc dùng nút mũi tên để sắp xếp các câu theo đúng thứ tự.
      </p>

      <SortableList
        items={order}
        getKey={(o) => o.id}
        onReorder={handleReorder}
        disabled={locked}
        itemState={itemState}
        renderItem={(o) => (
          <PinyinText
            text={o.text}
            pinyin={o.pinyin}
            showPinyin={showPinyin}
            size="base"
          />
        )}
      />

      {showTranslation && question.meta?.translation ? (
        <p className="text-sm italic text-muted-foreground">
          {question.meta.translation}
        </p>
      ) : null}
    </div>
  );
}

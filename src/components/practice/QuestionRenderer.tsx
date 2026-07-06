"use client";

import * as React from "react";
import type { QuestionComponentProps, QuestionType } from "@/lib/types";

// Listening
import { ListenChoosePicture } from "@/components/questions/ListenChoosePicture";
import { ListenTrueFalse } from "@/components/questions/ListenTrueFalse";
import { ListenConversationQA } from "@/components/questions/ListenConversationQA";
import { ListenPassageQA } from "@/components/questions/ListenPassageQA";
// Reading
import { ReadMatchPicture } from "@/components/questions/ReadMatchPicture";
import { ReadFillBlank } from "@/components/questions/ReadFillBlank";
import { ReadReorderParagraph } from "@/components/questions/ReadReorderParagraph";
import { ReadPassageQA } from "@/components/questions/ReadPassageQA";
import { ReadErrorDetection } from "@/components/questions/ReadErrorDetection";
// Writing
import { WriteReorderSentence } from "@/components/questions/WriteReorderSentence";
import { WritePicturePrompt } from "@/components/questions/WritePicturePrompt";
import { WriteCorrectError } from "@/components/questions/WriteCorrectError";
import { WriteEssay } from "@/components/questions/WriteEssay";
// Speaking
import { SpeakRepeat } from "@/components/questions/SpeakRepeat";
import { SpeakDescribePicture } from "@/components/questions/SpeakDescribePicture";
import { SpeakOpinion } from "@/components/questions/SpeakOpinion";
// Vocab
import { VocabWritePinyinHanzi } from "@/components/questions/VocabWritePinyinHanzi";
import { VocabRadicalAnalysis } from "@/components/questions/VocabRadicalAnalysis";
import { VocabSynonymDiff } from "@/components/questions/VocabSynonymDiff";

const REGISTRY: Record<
  QuestionType,
  React.ComponentType<QuestionComponentProps>
> = {
  LISTEN_CHOOSE_PICTURE: ListenChoosePicture,
  LISTEN_TRUE_FALSE: ListenTrueFalse,
  LISTEN_CONVERSATION_QA: ListenConversationQA,
  LISTEN_PASSAGE_QA: ListenPassageQA,
  READ_MATCH_PICTURE: ReadMatchPicture,
  READ_FILL_BLANK: ReadFillBlank,
  READ_REORDER_PARAGRAPH: ReadReorderParagraph,
  READ_PASSAGE_QA: ReadPassageQA,
  READ_ERROR_DETECTION: ReadErrorDetection,
  WRITE_REORDER_SENTENCE: WriteReorderSentence,
  WRITE_PICTURE_PROMPT: WritePicturePrompt,
  WRITE_CORRECT_ERROR: WriteCorrectError,
  WRITE_ESSAY: WriteEssay,
  SPEAK_REPEAT: SpeakRepeat,
  SPEAK_DESCRIBE_PICTURE: SpeakDescribePicture,
  SPEAK_OPINION: SpeakOpinion,
  VOCAB_WRITE_PINYIN_HANZI: VocabWritePinyinHanzi,
  VOCAB_RADICAL_ANALYSIS: VocabRadicalAnalysis,
  VOCAB_SYNONYM_DIFF: VocabSynonymDiff,
};

export function QuestionRenderer(props: QuestionComponentProps) {
  const Component = REGISTRY[props.question.type];
  if (!Component) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
        Loại câu hỏi chưa được hỗ trợ: {props.question.type}
      </div>
    );
  }
  return <Component {...props} />;
}

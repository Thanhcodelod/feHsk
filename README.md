# fehsk — HSK Master Frontend

Next.js 15 (App Router) · React 19 · Tailwind · Framer Motion · Lucide.
Giao diện **tiếng Việt** cho người Việt luyện thi HSK. Gọi backend (`behsk`) qua
các route proxy same-origin `/api/*` (tránh CORS).

## Chạy

```bash
npm install
npm run dev            # http://localhost:3000
```

Cần backend chạy ở `http://localhost:4000` (đổi qua `BACKEND_URL` trong `.env`).

```bash
cp .env.example .env   # BACKEND_URL=http://localhost:4000
```

## Scripts

| Lệnh | Việc |
|------|------|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Build production rồi chạy |
| `npm run typecheck` | `tsc --noEmit` |

## Cấu trúc

```
src/
├── app/
│   ├── page.tsx                         # Bảng điều khiển (Dashboard)
│   ├── practice/                        # Chọn cấp độ → kỹ năng → phiên luyện
│   └── api/                             # Route proxy → backend behsk
├── components/
│   ├── ui/                              # Nút, thẻ, badge, tabs, select… (kiểu shadcn)
│   ├── practice/                        # AudioButton, Recorder, PinyinText, OptionCard,
│   │                                    #   Chip/BlankSlot, SortableList, CountdownTimer,
│   │                                    #   QuestionRenderer, PracticeSession, FeedbackPanel
│   ├── questions/                       # 19 component — mỗi dạng câu hỏi một file
│   ├── dashboard/Dashboard.tsx
│   └── layout/Navbar.tsx
└── lib/
    ├── types.ts       # Hợp đồng QuestionComponentProps + mã hoá đáp án
    ├── api.ts         # Client gọi /api/*
    ├── speech.ts      # SpeechSynthesis (TTS) + SpeechRecognition (ASR)
    ├── recorder.ts    # MediaRecorder + lấy biên độ cho sóng âm
    ├── storage.ts     # Tiến độ học viên (localStorage) + thống kê
    ├── pinyin.ts      # Ruby pinyin (dữ liệu căn chỉnh + từ điển dự phòng)
    ├── similarity.ts  # So khớp phát âm phía client
    └── labels.ts      # Nhãn tiếng Việt + chuỗi UI
```

## Hợp đồng component câu hỏi

Mỗi component trong `components/questions/` nhận `QuestionComponentProps`
(`{ question, onAnswerChange, result, showPinyin, showTranslation }`), tự quản lý
trạng thái cục bộ, báo đáp án qua `onAnswerChange(answerString | null)`, và chuyển
sang chế độ xem lại khi `result` khác `null` — **suy ra đúng/sai chỉ từ `result`**
(đáp án không có trong `question`). Xem `lib/types.ts` để biết mã hoá đáp án từng dạng.

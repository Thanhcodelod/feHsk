"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  LogIn,
  UserPlus,
  AlertCircle,
  Cloud,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

const PERKS = [
  { icon: Cloud, text: "Lưu tiến trình theo tài khoản, đồng bộ mọi thiết bị" },
  { icon: Layers, text: "Flashcard & ôn tập lặp lại ngắt quãng (SM-2)" },
  { icon: CheckCircle2, text: "Chấm bài tức thì + giải thích bằng tiếng Việt" },
];

export function AuthCard() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = React.useState<"login" | "register">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim() || undefined);
      }
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Đã xảy ra lỗi. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl overflow-hidden rounded-2xl border shadow-elevated md:grid-cols-2">
      {/* Branded panel */}
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-primary via-sky-700 to-slate-900 p-8 text-white md:flex">
        <div>
          <span className="hanzi text-7xl font-semibold leading-none opacity-90">
            学
          </span>
          <h2 className="mt-4 text-2xl font-bold">HSK Master</h2>
          <p className="mt-1 text-sm text-white/80">
            Học tiếng Trung · Luyện thi HSK cho người Việt
          </p>
        </div>
        <ul className="mt-8 space-y-3">
          {PERKS.map((p) => {
            const Icon = p.icon;
            return (
              <li key={p.text} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="size-4" />
                </span>
                <span className="text-white/90">{p.text}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Form */}
      <div className="bg-card p-6 sm:p-8">
        <h1 className="text-xl font-bold">Tài khoản HSK Master</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Đăng nhập để lưu tiến trình học của bạn.
        </p>

        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as "login" | "register");
            setError("");
          }}
          className="mt-5"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Đăng nhập</TabsTrigger>
            <TabsTrigger value="register">Đăng ký</TabsTrigger>
          </TabsList>

          <form onSubmit={submit} className="mt-4 space-y-3">
            {mode === "register" ? (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Tên hiển thị
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  autoComplete="name"
                />
              </div>
            ) : null}
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@email.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Mật khẩu</label>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="animate-spin" />
              ) : mode === "login" ? (
                <LogIn />
              ) : (
                <UserPlus />
              )}
              {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
            </Button>
          </form>

          <TabsContent value="login" className="mt-4">
            <p className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
              Tài khoản demo (nếu đã seed CSDL):{" "}
              <span className="font-medium">an@hsk.vn</span> ·{" "}
              <span className="font-medium">binh@hsk.vn</span> ·{" "}
              <span className="font-medium">chi@hsk.vn</span> — mật khẩu{" "}
              <span className="font-medium">123456</span>.
            </p>
          </TabsContent>
          <TabsContent value="register" className="mt-4">
            <p className="text-xs text-muted-foreground">
              Bằng việc đăng ký, kết quả luyện tập của bạn sẽ được lưu lại và
              hiển thị ở bảng điều khiển.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, UserPlus, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

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
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Tài khoản HSK Master</CardTitle>
        <p className="text-sm text-muted-foreground">
          Đăng nhập để lưu tiến trình học của bạn theo tài khoản.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as "login" | "register");
            setError("");
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Đăng nhập</TabsTrigger>
            <TabsTrigger value="register">Đăng ký</TabsTrigger>
          </TabsList>

          <form onSubmit={submit} className="mt-4 space-y-3">
            {mode === "register" ? (
              <div>
                <label className="mb-1 block text-sm font-medium">Tên hiển thị</label>
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

            <Button type="submit" className="w-full" disabled={submitting}>
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
      </CardContent>
    </Card>
  );
}

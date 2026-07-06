"use client";

import Link from "next/link";
import { LogOut, LayoutDashboard, Mail, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function AccountPage() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Đang tải…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-8">
        <AuthCard />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {(user.name || user.email)[0]?.toUpperCase()}
            </div>
            <div>
              <CardTitle>{user.name || "Học viên"}</CardTitle>
              <p className="text-sm text-muted-foreground">Đã đăng nhập</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-lg bg-secondary/50 p-3 text-sm">
            <p className="flex items-center gap-2">
              <UserIcon className="size-4 text-muted-foreground" />
              {user.name || "—"}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              {user.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className={cn(buttonVariants())}>
              <LayoutDashboard /> Xem tiến độ
            </Link>
            <Button variant="outline" onClick={logout}>
              <LogOut /> Đăng xuất
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tiến trình học của bạn được lưu theo tài khoản này trên máy chủ.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

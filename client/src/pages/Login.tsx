
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { GraduationCap, Eye, EyeOff, ArrowRight, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "فشل تسجيل الدخول");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً ${data.firstName || data.username}`,
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                  <GraduationCap className="h-6 w-6" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  أكاديمية التدريب التعاوني
                </span>
                <span className="text-xs text-muted-foreground">منصة مجانية للتعلم والتطوير</span>
              </div>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              مرحباً بك مجدداً
            </div>
            <h1 className="text-3xl font-bold mb-2">تسجيل الدخول</h1>
            <p className="text-muted-foreground">
              سجل دخولك للوصول إلى لوحة التحكم والبدء في رحلتك التعليمية
            </p>
          </div>

          {/* Login Card */}
          <Card className="border-gradient-emerald shadow-2xl card-hover">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-base">اسم المستخدم</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    className="text-right h-11 text-base"
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base">كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="أدخل كلمة المرور"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="text-right pl-10 h-11 text-base"
                      dir="rtl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base btn-gradient-emerald" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent ml-2" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 ml-2" />
                      تسجيل الدخول
                    </>
                  )}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  ليس لديك حساب؟
                </p>
                <Link href="/register">
                  <Button variant="outline" className="w-full">
                    إنشاء حساب جديد
                  </Button>
                </Link>
              </div>

              {/* Demo Credentials */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-muted-foreground text-center mb-3 font-medium">
                  🔐 حسابات تجريبية للاختبار
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">👑 المسؤول</p>
                    <p className="text-muted-foreground">admin / admin123</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">🏢 مدير الغرف</p>
                    <p className="text-muted-foreground">manager / manager123</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="font-semibold text-purple-700 dark:text-purple-400 mb-1">⭐ قائد الفريق</p>
                    <p className="text-muted-foreground">leader / leader123</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="font-semibold text-orange-700 dark:text-orange-400 mb-1">👤 عضو</p>
                    <p className="text-muted-foreground">member / member123</p>
                  </div>
                </div>
              </div>

              {/* Back to Home */}
              <div className="mt-6 text-center">
                <Link href="/">
                  <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center gap-1 transition-colors">
                    <ArrowRight className="h-4 w-4" />
                    العودة للصفحة الرئيسية
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <p>© 2024 أكاديمية التدريب التعاوني - منصة مجانية 100%</p>
      </footer>
    </div>
  );
}

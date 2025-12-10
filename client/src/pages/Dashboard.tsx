
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  User, 
  Settings, 
  MessageSquare, 
  LogOut,
  Menu,
  X,
  Bell,
  Award,
  Target,
  TrendingUp,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Import sub-views
import ProfileView from "@/components/dashboard/ProfileView";
import ControlPanelView from "@/components/dashboard/ControlPanelView";
import ChatSpaceView from "@/components/dashboard/ChatSpaceView";

type DashboardView = "home" | "profile" | "control" | "chat";

const getInitials = (firstName?: string | null, lastName?: string | null) => {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "م";
};

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<DashboardView>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "تم تسجيل الخروج بنجاح" });
    } catch (error) {
      toast({ 
        variant: "destructive",
        title: "خطأ في تسجيل الخروج" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-red-600 bg-clip-text text-transparent">
                  أكاديمية المهارات
                </h1>
                <p className="text-xs text-muted-foreground">المنصة التدريبية التعاونية</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <Button
                variant={currentView === "home" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("home")}
                className="gap-2"
              >
                <Target className="h-4 w-4" />
                الرئيسية
              </Button>
              <Button
                variant={currentView === "profile" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("profile")}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                الملف الشخصي
              </Button>
              <Button
                variant={currentView === "control" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("control")}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                لوحة التحكم
              </Button>
              <Button
                variant={currentView === "chat" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentView("chat")}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                فضاء الدردشة
              </Button>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-600 rounded-full" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        {getInitials(user?.firstName, user?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium">
                      {user?.firstName || "مستخدم"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {getInitials(user?.firstName, user?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCurrentView("profile")}>
                    <User className="h-4 w-4 ml-2" />
                    الملف الشخصي
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView("control")}>
                    <Settings className="h-4 w-4 ml-2" />
                    لوحة التحكم
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 ml-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t">
              <Button
                variant={currentView === "home" ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => {
                  setCurrentView("home");
                  setMobileMenuOpen(false);
                }}
              >
                <Target className="h-4 w-4" />
                الرئيسية
              </Button>
              <Button
                variant={currentView === "profile" ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => {
                  setCurrentView("profile");
                  setMobileMenuOpen(false);
                }}
              >
                <User className="h-4 w-4" />
                الملف الشخصي
              </Button>
              <Button
                variant={currentView === "control" ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => {
                  setCurrentView("control");
                  setMobileMenuOpen(false);
                }}
              >
                <Settings className="h-4 w-4" />
                لوحة التحكم
              </Button>
              <Button
                variant={currentView === "chat" ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => {
                  setCurrentView("chat");
                  setMobileMenuOpen(false);
                }}
              >
                <MessageSquare className="h-4 w-4" />
                فضاء الدردشة
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === "home" && <HomeView />}
        {currentView === "profile" && <ProfileView />}
        {currentView === "control" && <ControlPanelView />}
        {currentView === "chat" && <ChatSpaceView />}
      </main>
    </div>
  );
}

// Home View Component
function HomeView() {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-red-600 bg-clip-text text-transparent">
          مرحباً بك في أكاديمية المهارات
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          منصة تدريبية تعاونية لتطوير مهاراتك من خلال العمل على مشاريع حقيقية
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
          <div className="text-3xl font-bold mb-2">{stats?.totalRooms || 0}</div>
          <div className="text-emerald-100">غرف التخصصات</div>
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
          <div className="text-3xl font-bold mb-2">{stats?.totalGroups || 0}</div>
          <div className="text-blue-100">فرق العمل</div>
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
          <div className="text-3xl font-bold mb-2">{stats?.totalProjects || 0}</div>
          <div className="text-purple-100">المشاريع</div>
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
          <div className="text-3xl font-bold mb-2">{stats?.totalUsers || 0}</div>
          <div className="text-red-100">الأعضاء</div>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <div className="p-8 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900 hover:shadow-xl transition-all">
          <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-4">
            <Award className="h-7 w-7 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">التعلم بالممارسة</h3>
          <p className="text-muted-foreground">
            تعلم من خلال العمل على مشاريع حقيقية مع فريق عمل متكامل
          </p>
        </div>
        <div className="p-8 rounded-2xl border-2 border-blue-100 dark:border-blue-900 hover:shadow-xl transition-all">
          <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
            <Target className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">مشاريع واقعية</h3>
          <p className="text-muted-foreground">
            اعمل على مشاريع حقيقية تضيف قيمة لسيرتك الذاتية
          </p>
        </div>
        <div className="p-8 rounded-2xl border-2 border-purple-100 dark:border-purple-900 hover:shadow-xl transition-all">
          <div className="h-14 w-14 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
            <TrendingUp className="h-7 w-7 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">تقييم مستمر</h3>
          <p className="text-muted-foreground">
            احصل على تقييمات وشارات تثبت تطورك ومهاراتك
          </p>
        </div>
      </div>
    </div>
  );
}


import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Building2, 
  Users, 
  FolderKanban, 
  ListTodo, 
  TrendingUp, 
  ArrowLeft,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { useAuth } from "@/hooks/useAuth";
import { cacheConfig } from "@/lib/queryClient";
import type { Room, Project, User } from "@shared/schema";

interface DashboardStats {
  totalRooms: number;
  totalGroups: number;
  totalProjects: number;
  totalTasks: number;
  activeProjects: number;
  pendingTasks: number;
}

export default function ControlPanelView() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    staleTime: cacheConfig.stats.staleTime,
  });

  const canManageRooms = user?.role === "admin";
  const canManageGroups = user?.role === "admin" || user?.role === "room_manager";

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">لوحة التحكم</h2>
          <p className="text-muted-foreground mt-1">إدارة المنصة والموارد</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="الغرف"
          value={stats?.totalRooms || 0}
          description="غرف التخصصات"
          icon={<Building2 className="h-5 w-5" />}
          isLoading={statsLoading}
        />
        <StatsCard
          title="المجموعات"
          value={stats?.totalGroups || 0}
          description="فرق العمل"
          icon={<Users className="h-5 w-5" />}
          isLoading={statsLoading}
        />
        <StatsCard
          title="المشاريع"
          value={stats?.activeProjects || 0}
          description="مشاريع نشطة"
          icon={<FolderKanban className="h-5 w-5" />}
          isLoading={statsLoading}
        />
        <StatsCard
          title="المهام"
          value={stats?.pendingTasks || 0}
          description="مهام قيد التنفيذ"
          icon={<ListTodo className="h-5 w-5" />}
          isLoading={statsLoading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-all cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-emerald-600" />
              إدارة الغرف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              عرض وإدارة غرف التخصصات والانضمام إليها
            </p>
            <Button className="w-full gap-2" variant="outline">
              <Building2 className="h-4 w-4" />
              عرض الغرف
              <ArrowLeft className="h-4 w-4 mr-auto" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-600" />
              إدارة المجموعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              إنشاء وإدارة مجموعات العمل والانضمام إليها
            </p>
            <Button className="w-full gap-2" variant="outline">
              <Users className="h-4 w-4" />
              عرض المجموعات
              <ArrowLeft className="h-4 w-4 mr-auto" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderKanban className="h-5 w-5 text-purple-600" />
              إدارة المشاريع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              اقتراح مشاريع جديدة ومتابعة المشاريع الجارية
            </p>
            <Button className="w-full gap-2" variant="outline">
              <FolderKanban className="h-4 w-4" />
              عرض المشاريع
              <ArrowLeft className="h-4 w-4 mr-auto" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListTodo className="h-5 w-5 text-red-600" />
              إدارة المهام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              عرض وإدارة المهام المخصصة لك ولفريقك
            </p>
            <Button className="w-full gap-2" variant="outline">
              <ListTodo className="h-4 w-4" />
              عرض المهام
              <ArrowLeft className="h-4 w-4 mr-auto" />
            </Button>
          </CardContent>
        </Card>

        {canManageRooms && (
          <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5 text-emerald-600" />
                إنشاء غرفة جديدة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                إنشاء غرفة تخصص جديدة للمنصة
              </p>
              <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4" />
                إنشاء غرفة
              </Button>
            </CardContent>
          </Card>
        )}

        {user?.role === "admin" && (
          <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-red-600" />
                لوحة الإدارة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                إدارة المستخدمين والصلاحيات والإحصائيات
              </p>
              <Button className="w-full gap-2 bg-red-600 hover:bg-red-700">
                <TrendingUp className="h-4 w-4" />
                لوحة الإدارة
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

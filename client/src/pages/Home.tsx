
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Building2, Users, FolderKanban, ListTodo, TrendingUp, ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/StatsCard";
import { RoomCard } from "@/components/RoomCard";
import { ProjectCard } from "@/components/ProjectCard";
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

export default function Home() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    staleTime: cacheConfig.stats.staleTime,
    gcTime: cacheConfig.stats.gcTime,
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery<(Room & { manager?: User | null; _count?: { groups?: number; members?: number } })[]>({
    queryKey: ["/api/rooms"],
    staleTime: cacheConfig.lists.staleTime,
    gcTime: cacheConfig.lists.gcTime,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<(Project & { proposedBy?: User | null })[]>({
    queryKey: ["/api/projects", { limit: 3 }],
    staleTime: cacheConfig.lists.staleTime,
    gcTime: cacheConfig.lists.gcTime,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-100 dark:border-emerald-900 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-background to-red-50/80 dark:from-emerald-950/30 dark:via-background dark:to-red-950/30" />
        <div className="relative p-8 md:p-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-14 w-14 rounded-full gradient-emerald-teal flex items-center justify-center shadow-lg glow-emerald">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold animated-gradient-text">
                لوحة التحكم
              </h1>
              <p className="text-muted-foreground mt-1">إدارة الانضمام للغرف والمجموعات</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Rooms and Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gradient-emerald card-hover shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-emerald-teal flex items-center justify-center">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              غرف التخصصات
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 hover:bg-emerald-100 dark:hover:bg-emerald-950 smooth-transition" asChild>
              <Link href="/rooms">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {roomsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : rooms && rooms.length > 0 ? (
              <div className="space-y-3">
                {rooms.slice(0, 2).map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد غرف بعد</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gradient-red card-hover shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-red-rose flex items-center justify-center">
                <FolderKanban className="h-4 w-4 text-white" />
              </div>
              أحدث المشاريع
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 hover:bg-red-100 dark:hover:bg-red-950 smooth-transition" asChild>
              <Link href="/projects">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {projectsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.slice(0, 2).map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد مشاريع بعد</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-2 border-emerald-100 dark:border-emerald-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-red-50/30 dark:from-emerald-950/20 dark:to-red-950/20 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            إجراءات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50 border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center mb-3">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-semibold mb-2 text-emerald-900 dark:text-emerald-100">انضم لغرفة</h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
                اختر غرفة تناسب تخصصك وانضم إلى فريق عمل
              </p>
              <Button size="sm" variant="outline" className="w-full" asChild>
                <Link href="/rooms">استكشف الغرف</Link>
              </Button>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950 dark:to-red-900/50 border border-red-200 dark:border-red-800 hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center mb-3">
                <FolderKanban className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-semibold mb-2 text-red-900 dark:text-red-100">شارك في المشاريع</h4>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                صوت على المشاريع المقترحة وشارك في تنفيذها
              </p>
              <Button size="sm" variant="outline" className="w-full" asChild>
                <Link href="/projects">عرض المشاريع</Link>
              </Button>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50 border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center mb-3">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-semibold mb-2 text-emerald-900 dark:text-emerald-100">انضم لمجموعة</h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
                استكشف المجموعات وانضم لفريق العمل
              </p>
              <Button size="sm" variant="outline" className="w-full" asChild>
                <Link href="/groups">استعرض المجموعات</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

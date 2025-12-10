import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, Users, Building2, FolderKanban, ListTodo, Shield, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatsCard } from "@/components/StatsCard";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { User, UserRole } from "@shared/schema";

interface DashboardStats {
  totalUsers: number;
  totalRooms: number;
  totalGroups: number;
  totalProjects: number;
  totalTasks: number;
  activeProjects: number;
  pendingTasks: number;
}

const roleLabels: Record<UserRole, string> = {
  admin: "مدير المنصة",
  room_manager: "مدير غرفة",
  team_leader: "قائد فريق",
  member: "عضو",
};

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "admin", label: "مدير المنصة" },
  { value: "room_manager", label: "مدير غرفة" },
  { value: "team_leader", label: "قائد فريق" },
  { value: "member", label: "عضو" },
];

const getInitials = (firstName?: string | null, lastName?: string | null) => {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "م";
};

export default function Admin() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAdmin,
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "تم تحديث صلاحية المستخدم بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ", description: "لم نتمكن من تحديث الصلاحية", variant: "destructive" });
    },
  });

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-red-100 dark:border-red-900">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/80 via-background to-emerald-50/80 dark:from-red-950/30 dark:via-background dark:to-emerald-950/30" />
          <div className="relative p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-emerald-600 bg-clip-text text-transparent">
                  لوحة التحكم
                </h1>
                <p className="text-muted-foreground mt-1">هذه الصفحة مخصصة لمديري المنصة فقط</p>
              </div>
            </div>
          </div>
        </div>
        <Card className="border-2 border-red-100 dark:border-red-900">
          <CardContent className="p-12">
            <EmptyState
              icon={<Shield className="h-12 w-12 text-red-500" />}
              title="غير مصرح"
              description="لوحة التحكم متاحة لمديري المنصة فقط"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-100 dark:border-emerald-900">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-background to-red-50/80 dark:from-emerald-950/30 dark:via-background dark:to-red-950/30" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-600 to-red-600 flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-emerald-700 to-red-600 bg-clip-text text-transparent">
                لوحة التحكم
              </h1>
              <p className="text-muted-foreground mt-1">إدارة المنصة والمستخدمين والإحصائيات</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="المستخدمين"
          value={stats?.totalUsers || 0}
          description="إجمالي المستخدمين"
          icon={<Users className="h-5 w-5" />}
          isLoading={statsLoading}
        />
        <StatsCard
          title="الغرف"
          value={stats?.totalRooms || 0}
          description="غرف التخصصات"
          icon={<Building2 className="h-5 w-5" />}
          isLoading={statsLoading}
        />
        <StatsCard
          title="المشاريع النشطة"
          value={stats?.activeProjects || 0}
          description="مشاريع قيد التنفيذ"
          icon={<FolderKanban className="h-5 w-5" />}
          isLoading={statsLoading}
        />
        <StatsCard
          title="المهام المعلقة"
          value={stats?.pendingTasks || 0}
          description="مهام قيد الإنجاز"
          icon={<ListTodo className="h-5 w-5" />}
          isLoading={statsLoading}
        />
      </div>

      <Card className="border-2 border-emerald-100 dark:border-emerald-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-transparent to-red-50/20 dark:from-emerald-950/10 dark:to-red-950/10 pointer-events-none" />
        <CardHeader className="relative bg-gradient-to-r from-emerald-50/50 to-red-50/50 dark:from-emerald-950/20 dark:to-red-950/20">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
            إدارة المستخدمين
          </CardTitle>
          <CardDescription>
            تعديل صلاحيات المستخدمين وإدارة أدوارهم
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {usersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">الصلاحية</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(u.firstName, u.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {u.firstName || u.lastName
                            ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
                            : "مستخدم"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.email || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {roleLabels[u.role as UserRole]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.id !== user?.id ? (
                        <Select
                          value={u.role}
                          onValueChange={(role) => updateRoleMutation.mutate({ userId: u.id, role: role as UserRole })}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-36" data-testid={`select-role-${u.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm text-muted-foreground">أنت</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={<Users className="h-8 w-8 text-muted-foreground" />}
              title="لا يوجد مستخدمين"
              description="لم يسجل أي مستخدمين بعد"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

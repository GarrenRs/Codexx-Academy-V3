
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { FolderKanban, Plus, Users, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import type { Project, Task, Group, User } from "@shared/schema";

interface ProjectWithDetails extends Project {
  proposedBy?: User | null;
  _count?: { tasks?: number };
}

export default function ProjectManagement() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium" as "high" | "medium" | "low",
    assignedToGroupId: "",
  });

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "room_manager" || isAdmin;

  const { data: project, isLoading: projectLoading } = useQuery<ProjectWithDetails>({
    queryKey: [`/api/projects/${id}`],
    enabled: !!id,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks?projectId=${id}`],
    enabled: !!id,
  });

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks?projectId=${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      toast({ title: "تم إنشاء المهمة بنجاح" });
      setIsCreateTaskOpen(false);
      setTaskForm({ title: "", description: "", priority: "medium", assignedToGroupId: "" });
    },
    onError: () => {
      toast({ title: "حدث خطأ", description: "لم نتمكن من إنشاء المهمة", variant: "destructive" });
    },
  });

  const handleCreateTask = () => {
    if (!taskForm.title.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال عنوان المهمة", variant: "destructive" });
      return;
    }

    createTaskMutation.mutate({
      ...taskForm,
      projectId: parseInt(id!),
      assignedToGroupId: taskForm.assignedToGroupId ? parseInt(taskForm.assignedToGroupId) : null,
      status: "todo",
    });
  };

  const markProjectInProgress = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/projects/${id}`, { status: "in_progress" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      toast({ title: "تم تحديث حالة المشروع إلى قيد التنفيذ" });
    },
  });

  if (projectLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!project || project.status !== "approved") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">المشروع غير معتمد أو غير موجود</p>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">هذه الصفحة مخصصة للمديرين فقط</p>
      </div>
    );
  }

  const tasksByStatus = {
    todo: tasks?.filter((t) => t.status === "todo") || [],
    in_progress: tasks?.filter((t) => t.status === "in_progress") || [],
    review: tasks?.filter((t) => t.status === "review") || [],
    done: tasks?.filter((t) => t.status === "done") || [],
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-100 dark:border-emerald-900">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-background to-red-50/80 dark:from-emerald-950/30 dark:via-background dark:to-red-950/30" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-600 to-red-600 flex items-center justify-center">
                  <FolderKanban className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{project.title}</h1>
                  <p className="text-sm text-muted-foreground mt-1">إدارة المشروع وتوزيع المهام</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {project.status === "approved" && (
                <Button
                  onClick={() => markProjectInProgress.mutate()}
                  disabled={markProjectInProgress.isPending}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700"
                >
                  <CheckCircle className="h-4 w-4 ml-2" />
                  بدء التنفيذ
                </Button>
              )}
              <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مهمة
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>إنشاء مهمة جديدة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">عنوان المهمة</Label>
                      <Input
                        id="title"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                        placeholder="مثال: تصميم واجهة المستخدم"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">الوصف</Label>
                      <Textarea
                        id="description"
                        value={taskForm.description}
                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        placeholder="وصف تفصيلي للمهمة..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">الأولوية</Label>
                      <Select
                        value={taskForm.priority}
                        onValueChange={(v) => setTaskForm({ ...taskForm, priority: v as any })}
                      >
                        <SelectTrigger id="priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">عالية</SelectItem>
                          <SelectItem value="medium">متوسطة</SelectItem>
                          <SelectItem value="low">منخفضة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="group">تعيين للمجموعة</Label>
                      <Select
                        value={taskForm.assignedToGroupId}
                        onValueChange={(v) => setTaskForm({ ...taskForm, assignedToGroupId: v })}
                      >
                        <SelectTrigger id="group">
                          <SelectValue placeholder="اختر مجموعة (اختياري)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">بدون تعيين</SelectItem>
                          {groups?.map((group) => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleCreateTask}
                      disabled={createTaskMutation.isPending}
                      className="w-full"
                    >
                      {createTaskMutation.isPending ? "جاري الإنشاء..." : "إنشاء المهمة"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">للتنفيذ</div>
            <div className="text-2xl font-bold">{tasksByStatus.todo.length}</div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">قيد التنفيذ</div>
            <div className="text-2xl font-bold">{tasksByStatus.in_progress.length}</div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">للمراجعة</div>
            <div className="text-2xl font-bold">{tasksByStatus.review.length}</div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">مكتمل</div>
            <div className="text-2xl font-bold text-emerald-600">{tasksByStatus.done.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            قائمة المهام
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : tasks && tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{task.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "destructive"
                              : task.priority === "medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {task.priority === "high" ? "عالية" : task.priority === "medium" ? "متوسطة" : "منخفضة"}
                        </Badge>
                        <Badge variant="outline">
                          {task.status === "todo"
                            ? "للتنفيذ"
                            : task.status === "in_progress"
                            ? "قيد التنفيذ"
                            : task.status === "review"
                            ? "للمراجعة"
                            : "مكتمل"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد مهام بعد. قم بإنشاء أول مهمة للمشروع
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

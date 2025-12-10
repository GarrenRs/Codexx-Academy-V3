import { Calendar, CheckCircle2, Clock, AlertTriangle, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Task, User, Group, TaskPriority, TaskStatus, Project } from "@shared/schema";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";


interface TaskCardProps {
  task: Task & {
    assignedToUser?: User | null;
    assignedToGroup?: Group | null;
    project?: Project | null;
  };
  onStatusChange?: (taskId: number, status: TaskStatus) => void;
  onProgressChange?: (taskId: number, progress: number) => void;
  isDraggable?: boolean;
  showStatusUpdate?: boolean;
}

const priorityConfig: Record<TaskPriority, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  low: { label: "منخفضة", variant: "secondary" },
  medium: { label: "متوسطة", variant: "default" },
  high: { label: "عالية", variant: "destructive" },
};

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: "للتنفيذ", color: "bg-muted" },
  in_progress: { label: "قيد التنفيذ", color: "bg-blue-500" },
  review: { label: "للمراجعة", color: "bg-yellow-500" },
  done: { label: "مكتمل", color: "bg-green-500" },
};

export function TaskCard({ task, onStatusChange, onProgressChange, isDraggable, showStatusUpdate = true }: TaskCardProps) {
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const isDone = task.status === "done";
  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: async (status: TaskStatus) => {
      return apiRequest("PATCH", `/api/tasks/${task.id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "تم تحديث حالة المهمة بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ", variant: "destructive" });
    },
  });


  const handleToggleDone = () => {
    if (onStatusChange) {
      onStatusChange(task.id, isDone ? "todo" : "done");
    }
  };

  return (
    <Card
      className={`transition-all duration-200 border-2 border-red-100 dark:border-red-900 hover:border-red-200 dark:hover:border-red-800 hover:shadow-md ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      data-testid={`card-task-${task.id}`}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <Checkbox
          checked={isDone}
          onCheckedChange={handleToggleDone}
          className="mt-1"
          data-testid={`checkbox-task-${task.id}`}
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-medium text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </h4>
            <Badge variant={priority.variant} className="shrink-0 text-xs">
              {priority.label}
            </Badge>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        {showStatusUpdate && (
          <div className="mt-2">
            <Select
              value={task.status}
              onValueChange={(status) => updateStatusMutation.mutate(status as TaskStatus)}
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">للتنفيذ</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="review">للمراجعة</SelectItem>
                <SelectItem value="done">مكتمل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">التقدم</span>
            <span className="font-medium">{task.progress}%</span>
          </div>
          <Progress value={task.progress} className="h-1.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.dueDate), "d MMM", { locale: ar })}</span>
            </div>
          )}

          {task.assignedToUser && (
            <div className="flex items-center gap-1">
              <Avatar className="h-4 w-4">
                <AvatarImage src={task.assignedToUser.profileImageUrl || undefined} />
                <AvatarFallback className="text-[8px]">
                  {task.assignedToUser.firstName?.charAt(0) || "م"}
                </AvatarFallback>
              </Avatar>
              <span>{task.assignedToUser.firstName}</span>
            </div>
          )}

          {task.assignedToGroup && (
            <div className="flex items-center gap-1">
              <UserIcon className="h-3 w-3" />
              <span>{task.assignedToGroup.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
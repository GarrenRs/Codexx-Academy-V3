import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListTodo, Filter, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskBoard } from "@/components/TaskBoard";
import { TaskCard } from "@/components/TaskCard";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import type { Task, Project, Group, User, TaskStatus, TaskPriority } from "@shared/schema";

type ViewMode = "board" | "list";

const priorityFilters: { value: TaskPriority | "all"; label: string }[] = [
  { value: "all", label: "كل الأولويات" },
  { value: "high", label: "عالية" },
  { value: "medium", label: "متوسطة" },
  { value: "low", label: "منخفضة" },
];

export default function Tasks() {
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const { user } = useAuth();

  const { data: tasks, isLoading } = useQuery<(Task & {
    project?: Project | null;
    assignedToGroup?: Group | null;
    assignedToUser?: User | null;
  })[]>({
    queryKey: ["/api/tasks"],
  });

  const filteredTasks = tasks?.filter((task) => {
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    return true;
  });

  const groupedTasks = {
    todo: filteredTasks?.filter((t) => t.status === "todo") || [],
    in_progress: filteredTasks?.filter((t) => t.status === "in_progress") || [],
    review: filteredTasks?.filter((t) => t.status === "review") || [],
    done: filteredTasks?.filter((t) => t.status === "done") || [],
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-red-100 dark:border-red-900">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/80 via-background to-emerald-50/80 dark:from-red-950/30 dark:via-background dark:to-emerald-950/30" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                  <ListTodo className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-emerald-600 bg-clip-text text-transparent">
                  المهام
                </h1>
              </div>
              <p className="text-muted-foreground">تتبع وأدر مهامك ومهام فريقك</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border-2 border-red-100 dark:border-red-900 rounded-lg p-1 bg-white dark:bg-slate-900">
                <Button
                  variant={viewMode === "board" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("board")}
                  data-testid="button-view-board"
                  className={viewMode === "board" ? "bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800" : ""}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  data-testid="button-view-list"
                  className={viewMode === "list" ? "bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800" : ""}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | "all")}>
            <SelectTrigger className="w-40" data-testid="select-priority-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityFilters.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        viewMode === "board" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )
      ) : filteredTasks && filteredTasks.length > 0 ? (
        viewMode === "board" ? (
          <TaskBoard tasks={groupedTasks} />
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={<ListTodo className="h-8 w-8 text-muted-foreground" />}
          title="لا توجد مهام"
          description="لم يتم تعيين أي مهام بعد"
        />
      )}
    </div>
  );
}

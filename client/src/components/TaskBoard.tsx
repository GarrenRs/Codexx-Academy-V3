import { Plus, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskCard } from "./TaskCard";
import type { Task, User, Group, TaskStatus } from "@shared/schema";

interface TaskWithRelations extends Task {
  assignedToUser?: User | null;
  assignedToGroup?: Group | null;
}

interface TaskBoardProps {
  tasks: { [key in TaskStatus]: TaskWithRelations[] };
  onStatusChange?: (taskId: number, status: TaskStatus) => void;
  onAddTask?: () => void;
  isLoading?: boolean;
}

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: "todo", label: "للتنفيذ", color: "bg-muted" },
  { status: "in_progress", label: "قيد التنفيذ", color: "bg-blue-500" },
  { status: "review", label: "للمراجعة", color: "bg-yellow-500" },
  { status: "done", label: "مكتمل", color: "bg-green-500" },
];

export function TaskBoard({ tasks, onStatusChange, onAddTask, isLoading }: TaskBoardProps) {
  const getTasksByStatus = (status: TaskStatus) =>
    tasks[status] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">لوحة المهام</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" />
            تصفية
          </Button>
          {onAddTask && (
            <Button size="sm" className="gap-1.5" onClick={onAddTask} data-testid="button-add-task">
              <Plus className="h-4 w-4" />
              إضافة مهمة
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.status);
          return (
            <Card key={column.status} className="flex flex-col" data-testid={`column-${column.status}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
                    <span>{column.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {columnTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <ScrollArea className="h-[400px] pr-2">
                  <div className="space-y-3">
                    {columnTasks.length === 0 ? (
                      <div className="flex items-center justify-center h-20 text-sm text-muted-foreground border-2 border-dashed rounded-md">
                        لا توجد مهام
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onStatusChange={onStatusChange}
                          isDraggable
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

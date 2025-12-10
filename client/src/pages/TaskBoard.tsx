import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, Plus } from "lucide-react";

export default function TaskBoard({
  columns,
  getTasksByStatus,
  onAddTask,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">لوحة المهام</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 border-2 border-emerald-100 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
            <Filter className="h-4 w-4" />
            تصفية
          </Button>
          {onAddTask && (
            <Button size="sm" className="gap-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800" onClick={onAddTask} data-testid="button-add-task">
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
            <Card key={column.status} className="flex flex-col border-2 border-emerald-100 dark:border-emerald-900 overflow-hidden" data-testid={`column-${column.status}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/10 via-transparent to-red-50/10 dark:from-emerald-950/5 dark:to-red-950/5 pointer-events-none" />
              <CardHeader className="relative pb-3 bg-gradient-to-r from-emerald-50/30 to-red-50/30 dark:from-emerald-950/10 dark:to-red-950/10">
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
              <CardContent className="relative flex-1 pt-0">
                {columnTasks.length > 0 ? (
                  <div className="space-y-3">
                    {columnTasks.map((task) => (
                      <Card
                        key={task.id}
                        className="shadow-sm"
                        data-testid={`task-${task.id}`}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-normal">
                            {task.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 px-4 pb-2 text-xs text-muted-foreground">
                          {task.description}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    لا توجد مهام
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-50/50 via-background to-red-50/50 dark:from-emerald-950/20 dark:via-background dark:to-red-950/20">
      <Card className="w-full max-w-md mx-4 border-2 border-red-100 dark:border-red-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 via-transparent to-emerald-50/30 dark:from-red-950/15 dark:to-emerald-950/15 pointer-events-none" />
        <CardContent className="relative pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-emerald-600 bg-clip-text text-transparent">
              404 - الصفحة غير موجودة
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              الصفحة التي تبحث عنها غير موجودة
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

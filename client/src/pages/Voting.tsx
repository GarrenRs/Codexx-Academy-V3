import { useQuery, useMutation } from "@tanstack/react-query";
import { Vote, ThumbsUp, ThumbsDown, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { VotingPanel } from "@/components/VotingPanel";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Project, User, ProjectVote } from "@shared/schema";

interface ProjectWithVotes extends Project {
  proposedBy?: User | null;
  votes?: ProjectVote[];
  _count?: { approves: number; rejects: number };
}

export default function Voting() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isManager = user?.role === "admin" || user?.role === "room_manager";

  const { data: votingProjects, isLoading } = useQuery<ProjectWithVotes[]>({
    queryKey: ["/api/projects", { status: "voting" }],
  });

  const voteMutation = useMutation({
    mutationFn: async ({ projectId, vote }: { projectId: number; vote: boolean }) => {
      return apiRequest("POST", `/api/projects/${projectId}/vote`, { vote });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "تم تسجيل صوتك بنجاح" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "غير مصرح", description: "يرجى تسجيل الدخول", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "حدث خطأ", description: "لم نتمكن من تسجيل صوتك", variant: "destructive" });
    },
  });

  if (!isManager) {
    return (
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-red-100 dark:border-red-900">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/80 via-background to-emerald-50/80 dark:from-red-950/30 dark:via-background dark:to-emerald-950/30" />
          <div className="relative p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                <Vote className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-emerald-600 bg-clip-text text-transparent">
                  التصويت
                </h1>
                <p className="text-muted-foreground mt-1">هذه الصفحة مخصصة للمديرين فقط</p>
              </div>
            </div>
          </div>
        </div>
        <Card className="border-2 border-red-100 dark:border-red-900">
          <CardContent className="p-12">
            <EmptyState
              icon={<Vote className="h-12 w-12 text-red-500" />}
              title="غير مصرح"
              description="التصويت على المشاريع متاح للمديرين فقط"
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
              <Vote className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-emerald-700 to-red-600 bg-clip-text text-transparent">
                التصويت على المشاريع
              </h1>
              <p className="text-muted-foreground mt-1">راجع المشاريع المقترحة وصوت عليها</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : votingProjects && votingProjects.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {votingProjects.map((project) => (
            <VotingPanel
              key={project.id}
              project={project}
              currentUserId={user?.id}
              onVote={(vote) => voteMutation.mutate({ projectId: project.id, vote })}
              isVoting={voteMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Vote className="h-8 w-8 text-muted-foreground" />}
          title="لا توجد مشاريع للتصويت"
          description="لا توجد مشاريع تنتظر التصويت حالياً"
        />
      )}
    </div>
  );
}

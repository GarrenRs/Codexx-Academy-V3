
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
  FolderKanban,
  ArrowRight,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  Clock,
  User as UserIcon,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { VotingPanel } from "@/components/VotingPanel";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Project, User, ProjectVote, ProjectStatus } from "@shared/schema";

interface ProjectWithDetails extends Project {
  proposedBy?: User | null;
  votes?: ProjectVote[];
  _count?: { votes?: number; tasks?: number };
  approvalRate?: number;
  userVote?: ProjectVote | null;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  proposed: { label: "مقترح", variant: "outline" },
  voting: { label: "قيد التصويت", variant: "default" },
  approved: { label: "معتمد", variant: "default" },
  in_progress: { label: "قيد التنفيذ", variant: "default" },
  completed: { label: "مكتمل", variant: "secondary" },
  rejected: { label: "مرفوض", variant: "destructive" },
};

export default function ProjectDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: project, isLoading } = useQuery<ProjectWithDetails>({
    queryKey: [`/api/projects/${id}`],
    enabled: !!id,
  });

  const { data: votes } = useQuery<ProjectVote[]>({
    queryKey: [`/api/projects/${id}/votes`],
    enabled: !!id && project?.status === "voting",
  });

  const voteMutation = useMutation({
    mutationFn: async (vote: boolean) => {
      return apiRequest("POST", `/api/projects/${id}/vote`, { vote });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}/votes`] });
      toast({ title: "تم تسجيل تصويتك بنجاح" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "غير مصرح", description: "يرجى تسجيل الدخول", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "حدث خطأ", description: "لم نتمكن من تسجيل تصويتك", variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/projects/${id}`, { status: "approved", approvedAt: new Date().toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "تم اعتماد المشروع بنجاح" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "غير مصرح", variant: "destructive" });
        return;
      }
      toast({ title: "حدث خطأ", description: "لم نتمكن من اعتماد المشروع", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/projects/${id}`, { status: "rejected" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "تم رفض المشروع" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "غير مصرح", variant: "destructive" });
        return;
      }
      toast({ title: "حدث خطأ", description: "لم نتمكن من رفض المشروع", variant: "destructive" });
    },
  });

  const startVotingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/projects/${id}`, { status: "voting" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "تم فتح التصويت على المشروع" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "غير مصرح", variant: "destructive" });
        return;
      }
      toast({ title: "حدث خطأ", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">المشروع غير موجود</h2>
        <Button onClick={() => setLocation("/projects")}>العودة للمشاريع</Button>
      </div>
    );
  }

  const status = statusConfig[project.status];
  const isAdmin = user?.role === "admin";
  const isRoomManager = user?.role === "room_manager" || isAdmin;
  const canVote = project.status === "voting" && isRoomManager;
  const canApprove = project.status === "voting" && isAdmin;
  const canStartVoting = project.status === "proposed" && isAdmin;
  const canManageProject = (project.status === "approved" || project.status === "in_progress") && isRoomManager;
  const userVote = votes?.find((v) => v.voterId === user?.id);

  // حساب نسبة الموافقة
  const approvalCount = votes?.filter((v) => v.vote === true).length || 0;
  const rejectionCount = votes?.filter((v) => v.vote === false).length || 0;
  const totalVotes = votes?.length || 0;
  const approvalRate = totalVotes > 0 ? (approvalCount / totalVotes) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/projects")}>
          المشاريع
        </Button>
        <ArrowRight className="h-4 w-4 rotate-180" />
        <span>{project.title}</span>
      </div>

      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-100 dark:border-emerald-900">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-background to-red-50/80 dark:from-emerald-950/30 dark:via-background dark:to-red-950/30" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-600 to-red-600 flex items-center justify-center">
                <FolderKanban className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{project.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  تم اقتراحه في {new Date(project.createdAt!).toLocaleDateString("ar-SA")}
                </p>
              </div>
            </div>
            <Badge variant={status.variant} className="text-sm">
              {status.label}
            </Badge>
          </div>

          {project.proposedBy && (
            <div className="flex items-center gap-3 bg-background/50 backdrop-blur-sm rounded-lg p-3 w-fit">
              <Avatar className="h-10 w-10">
                <AvatarImage src={project.proposedBy.profileImageUrl || undefined} />
                <AvatarFallback className="bg-muted">
                  {project.proposedBy.firstName?.charAt(0) || "م"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {project.proposedBy.firstName} {project.proposedBy.lastName}
                </p>
                <p className="text-xs text-muted-foreground">مقترح المشروع</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>وصف المشروع</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {project.description}
              </p>
            </CardContent>
          </Card>

          {/* Voting Panel for voting status */}
          {project.status === "voting" && (
            <VotingPanel
              project={project}
              canVote={canVote}
              canApprove={canApprove}
              onVote={(vote) => voteMutation.mutate(vote)}
              onApprove={() => approveMutation.mutate()}
              onReject={() => rejectMutation.mutate()}
              isVoting={voteMutation.isPending}
              isApproving={approveMutation.isPending || rejectMutation.isPending}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Card */}
          {(canStartVoting || canApprove || canManageProject) && (
            <Card className="border-2 border-emerald-100 dark:border-emerald-900">
              <CardHeader>
                <CardTitle className="text-lg">الإجراءات الإدارية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canManageProject && (
                  <Button
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                    onClick={() => setLocation(`/projects/${id}/manage`)}
                  >
                    <FolderKanban className="h-4 w-4 ml-2" />
                    إدارة المشروع
                  </Button>
                )}
                {canStartVoting && (
                  <Button
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                    onClick={() => startVotingMutation.mutate()}
                    disabled={startVotingMutation.isPending}
                    data-testid="button-start-voting"
                  >
                    {startVotingMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    فتح التصويت
                  </Button>
                )}

                {project.status === "proposed" && isAdmin && (
                  <>
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => approveMutation.mutate()}
                      disabled={approveMutation.isPending}
                      data-testid="button-direct-approve"
                    >
                      {approveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                      <CheckCircle2 className="h-4 w-4 ml-2" />
                      اعتماد مباشر
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => rejectMutation.mutate()}
                      disabled={rejectMutation.isPending}
                      data-testid="button-direct-reject"
                    >
                      {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                      <XCircle className="h-4 w-4 ml-2" />
                      رفض المشروع
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">الإحصائيات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.status === "voting" && totalVotes > 0 && (
                <>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">نسبة الموافقة</span>
                      <span className="font-bold">{Math.round(approvalRate)}%</span>
                    </div>
                    <Progress value={approvalRate} className="h-2" />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-2xl font-bold">{approvalCount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">موافق</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400">
                        <ThumbsDown className="h-4 w-4" />
                        <span className="text-2xl font-bold">{rejectionCount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">رافض</p>
                    </div>
                  </div>
                </>
              )}

              {project._count?.tasks !== undefined && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">عدد المهام</span>
                    <span className="font-bold">{project._count.tasks}</span>
                  </div>
                </>
              )}

              {project.approvedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">تاريخ الاعتماد</p>
                    <p className="font-medium text-sm">
                      {new Date(project.approvedAt).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                </>
              )}

              {project.completedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">تاريخ الإنجاز</p>
                    <p className="font-medium text-sm">
                      {new Date(project.completedAt).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* User Vote Status */}
          {userVote && (
            <Alert className={userVote.vote ? "border-emerald-200 dark:border-emerald-900" : "border-red-200 dark:border-red-900"}>
              <AlertDescription className="flex items-center gap-2">
                {userVote.vote ? (
                  <>
                    <ThumbsUp className="h-4 w-4 text-emerald-600" />
                    <span>لقد صوت بالموافقة على هذا المشروع</span>
                  </>
                ) : (
                  <>
                    <ThumbsDown className="h-4 w-4 text-red-600" />
                    <span>لقد صوت برفض هذا المشروع</span>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}

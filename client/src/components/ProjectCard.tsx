import { Link } from "wouter";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Vote,
  Play,
  FileText,
  User as UserIcon,
  ThumbsUp,
  ThumbsDown,
  FolderKanban,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { Project, User, ProjectStatus } from "@shared/schema";

interface ProjectCardProps {
  project: Project & {
    proposedBy?: User | null;
    _count?: { votes?: number; tasks?: number };
    approvalRate?: number;
    userVote?: boolean | null;
  };
  canVote?: boolean;
  canApprove?: boolean;
  onVote?: (projectId: number, vote: boolean) => void;
  onApprove?: (projectId: number) => void;
  onReject?: (projectId: number) => void;
  isVoting?: boolean;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }
> = {
  proposed: { label: "مقترح", variant: "outline", icon: FileText },
  voting: { label: "قيد التصويت", variant: "default", icon: Vote },
  approved: { label: "معتمد", variant: "default", icon: CheckCircle2 },
  in_progress: { label: "قيد التنفيذ", variant: "default", icon: Play },
  completed: { label: "مكتمل", variant: "secondary", icon: CheckCircle2 },
  rejected: { label: "مرفوض", variant: "destructive", icon: XCircle },
};

export function ProjectCard({
  project,
  canVote,
  canApprove,
  onVote,
  onApprove,
  onReject,
  isVoting,
}: ProjectCardProps) {
  const status = statusConfig[project.status];
  const StatusIcon = status.icon;
  const voteCount = project._count?.votes || 0;
  const approvalRate = project.approvalRate || 0;

  const statusVariant = status.variant;
  const statusLabels: Record<ProjectStatus, string> = {
    proposed: "مقترح",
    voting: "قيد التصويت",
    approved: "معتمد",
    in_progress: "قيد التنفيذ",
    completed: "مكتمل",
    rejected: "مرفوض",
  };

  return (
    <Card className="relative overflow-hidden card-hover border-gradient-emerald shadow-lg" data-testid={`project-card-${project.id}`}>
      <div className="absolute top-0 right-0 w-24 h-24 gradient-emerald-teal opacity-5 rounded-full blur-3xl"></div>
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-emerald-teal flex items-center justify-center text-white shadow-md">
              <FolderKanban className="h-4 w-4" />
            </div>
            <span className="font-bold">{project.title}</span>
          </CardTitle>
          <Badge variant={statusVariant} className="smooth-transition">
            {statusLabels[project.status as ProjectStatus]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-3">
        {project.proposedBy && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={project.proposedBy.profileImageUrl || undefined} />
              <AvatarFallback className="text-xs bg-muted">
                {project.proposedBy.firstName?.charAt(0) || "م"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              مقترح من: {project.proposedBy.firstName} {project.proposedBy.lastName}
            </span>
          </div>
        )}

        {(project.status === "voting" || project.status === "proposed") && voteCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">نسبة الموافقة</span>
              <span className="font-medium">{Math.round(approvalRate)}%</span>
            </div>
            <Progress value={approvalRate} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {voteCount} صوت
            </p>
          </div>
        )}

        {project.status === "in_progress" && project._count?.tasks && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{project._count.tasks} مهمة</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-0">
        {project.status === "voting" && canVote && onVote && (
          <>
            <Button
              variant={project.userVote === true ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => onVote(project.id, true)}
              disabled={isVoting}
              data-testid={`button-vote-approve-${project.id}`}
            >
              <ThumbsUp className="h-4 w-4" />
              موافق
            </Button>
            <Button
              variant={project.userVote === false ? "destructive" : "outline"}
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => onVote(project.id, false)}
              disabled={isVoting}
              data-testid={`button-vote-reject-${project.id}`}
            >
              <ThumbsDown className="h-4 w-4" />
              رفض
            </Button>
          </>
        )}

        {project.status === "voting" && canApprove && (
          <>
            <Button
              variant="default"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => onApprove?.(project.id)}
              data-testid={`button-approve-project-${project.id}`}
            >
              <CheckCircle2 className="h-4 w-4" />
              اعتماد
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => onReject?.(project.id)}
              data-testid={`button-reject-project-${project.id}`}
            >
              <XCircle className="h-4 w-4" />
              رفض
            </Button>
          </>
        )}

        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/projects/${project.id}`} data-testid={`button-view-project-${project.id}`}>
            عرض التفاصيل
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
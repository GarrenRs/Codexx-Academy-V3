import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Users, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Project, User, ProjectVote } from "@shared/schema";

interface VotingPanelProps {
  project: Project & {
    proposedBy?: User | null;
    votes?: Array<ProjectVote & { voter?: User }>;
  };
  currentUserId?: string;
  canVote?: boolean;
  canApprove?: boolean;
  onVote?: (vote: boolean) => void;
  onApprove?: () => void;
  onReject?: () => void;
  isVoting?: boolean;
  isApproving?: boolean;
}

export function VotingPanel({
  project,
  currentUserId,
  canVote,
  canApprove,
  onVote,
  onApprove,
  onReject,
  isVoting,
  isApproving,
}: VotingPanelProps) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const votes = project.votes || [];
  const approveVotes = votes.filter((v) => v.vote === true);
  const rejectVotes = votes.filter((v) => v.vote === false);
  const totalVotes = votes.length;
  const approvalRate = totalVotes > 0 ? (approveVotes.length / totalVotes) * 100 : 0;
  const userVote = votes.find((v) => v.voterId === currentUserId);

  useEffect(() => {
    if (project.status !== "voting" || !project.createdAt) return;

    const interval = setInterval(() => {
      const createdAt = project.createdAt ? new Date(project.createdAt).getTime() : Date.now();
      const votingDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
      const expiresAt = createdAt + votingDuration;
      const now = Date.now();
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        setTimeLeft("انتهى وقت التصويت");
        clearInterval(interval);
      } else {
        const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
        const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m`);
        }
      }
    }, 60000); // Update every minute

    // Initial calculation
    const createdAt = project.createdAt ? new Date(project.createdAt).getTime() : Date.now();
    const votingDuration = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = createdAt + votingDuration;
    const remaining = expiresAt - Date.now();
    if (remaining > 0) {
      const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      setTimeLeft(days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`);
    } else {
      setTimeLeft("انتهى وقت التصويت");
    }

    return () => clearInterval(interval);
  }, [project.status, project.createdAt]);

  return (
    <Card className="border-2 border-emerald-100 dark:border-emerald-900 overflow-hidden" data-testid="voting-panel">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-transparent to-red-50/20 dark:from-emerald-950/10 dark:to-red-950/10 pointer-events-none" />
      <CardHeader className="relative bg-gradient-to-r from-emerald-50/50 to-red-50/50 dark:from-emerald-950/20 dark:to-red-950/20">
        <CardTitle className="flex items-center justify-between gap-2">
          <span>التصويت على المشروع</span>
          <div className="flex items-center gap-2">
            {timeLeft && (
              <Badge variant={timeLeft === "انتهى وقت التصويت" ? "destructive" : "outline"} className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeLeft}
              </Badge>
            )}
            <Badge variant="outline">{project.status === "voting" ? "مفتوح" : "مغلق"}</Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-6">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{project.title}</h3>
          <p className="text-sm text-muted-foreground">{project.description}</p>
        </div>

        {project.proposedBy && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={project.proposedBy.profileImageUrl || undefined} />
              <AvatarFallback className="text-xs bg-muted">
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

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">نتائج التصويت</span>
            <span className="text-sm text-muted-foreground">{totalVotes} صوت</span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <ThumbsUp className="h-4 w-4" />
                  <span>موافق</span>
                </div>
                <span className="font-medium">{approveVotes.length}</span>
              </div>
              <Progress value={totalVotes > 0 ? (approveVotes.length / totalVotes) * 100 : 0} className="h-2 bg-muted" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <ThumbsDown className="h-4 w-4" />
                  <span>رفض</span>
                </div>
                <span className="font-medium">{rejectVotes.length}</span>
              </div>
              <Progress value={totalVotes > 0 ? (rejectVotes.length / totalVotes) * 100 : 0} className="h-2 bg-muted" />
            </div>
          </div>
        </div>

        {votes.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">المصوتون</h4>
              <div className="flex flex-wrap gap-2">
                {votes.slice(0, 10).map((vote) => (
                  <div
                    key={vote.id}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                      vote.vote
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={vote.voter?.profileImageUrl || undefined} />
                      <AvatarFallback className="text-[8px]">
                        {vote.voter?.firstName?.charAt(0) || "م"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{vote.voter?.firstName}</span>
                    {vote.vote ? (
                      <ThumbsUp className="h-3 w-3" />
                    ) : (
                      <ThumbsDown className="h-3 w-3" />
                    )}
                  </div>
                ))}
                {votes.length > 10 && (
                  <span className="text-xs text-muted-foreground px-2 py-1">
                    +{votes.length - 10} آخرين
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        {project.status === "voting" && canVote && onVote && (
          <>
            <Button
              variant={userVote?.vote === true ? "default" : "outline"}
              className="flex-1 gap-2"
              onClick={() => onVote(true)}
              disabled={isVoting}
              data-testid="button-vote-approve"
            >
              <ThumbsUp className="h-4 w-4" />
              موافق
            </Button>
            <Button
              variant={userVote?.vote === false ? "destructive" : "outline"}
              className="flex-1 gap-2"
              onClick={() => onVote(false)}
              disabled={isVoting}
              data-testid="button-vote-reject"
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
              className="flex-1 gap-2"
              onClick={onApprove}
              disabled={isApproving}
              data-testid="button-admin-approve"
            >
              <CheckCircle2 className="h-4 w-4" />
              اعتماد المشروع
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-2"
              onClick={onReject}
              disabled={isApproving}
              data-testid="button-admin-reject"
            >
              <XCircle className="h-4 w-4" />
              رفض المشروع
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

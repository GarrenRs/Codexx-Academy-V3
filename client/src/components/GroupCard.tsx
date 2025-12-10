import { Link } from "wouter";
import { Users, FolderKanban, ArrowLeft, UserPlus, LogOut as LeaveIcon, Loader2, Building2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { Group, User } from "@shared/schema";

interface GroupCardProps {
  group: Group & {
    leader?: User | null;
    members?: Array<{ user: User }>;
    room?: { name: string };
    _count?: { members?: number };
  };
  currentUserId?: string;
  onJoin?: (groupId: number) => void;
  onLeave?: (groupId: number) => void;
  isJoining?: boolean;
  isLeaving?: boolean;
}

export function GroupCard({
  group,
  currentUserId,
  onJoin,
  onLeave,
  isJoining,
  isLeaving,
}: GroupCardProps) {
  const memberCount = group._count?.members || group.members?.length || 0;
  const isFull = memberCount >= group.maxMembers;
  const isMember = group.members?.some((m) => m.user.id === currentUserId);
  const isLeader = group.leaderId === currentUserId;

  const membersToShow = group.members?.slice(0, 4) || [];
  const progress = (memberCount / group.maxMembers) * 100;

  return (
    <Card className="group transition-all duration-200 border-2 bg-card shadow-sm hover:shadow-md hover:shadow-primary/20" data-testid={`card-group-${group.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-foreground">{group.name}</h3>
              {isMember && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 backdrop-blur-sm">
                  منضم
                </Badge>
              )}
            </div>
            {group.room && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                في غرفة: {group.room.name}
              </p>
            )}
          </div>
          <Badge variant={isFull ? "secondary" : "default"} className="backdrop-blur-sm">
            {isFull ? "مكتملة" : "متاحة"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-3">
        <div className="flex items-center -space-x-2 space-x-reverse">
          {membersToShow.map((member, idx) => (
            <Avatar
              key={member.user.id}
              className="h-8 w-8 border-2 border-card"
              style={{ zIndex: 4 - idx }}
            >
              <AvatarImage src={member.user.profileImageUrl || undefined} alt={member.user.firstName} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {member.user.firstName?.charAt(0) || "م"}
              </AvatarFallback>
            </Avatar>
          ))}
          {memberCount > 4 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium text-muted-foreground">
              +{memberCount - 4}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">الأعضاء</span>
            <span className="font-medium text-foreground">
              {memberCount} / {group.maxMembers}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-muted/50" indicatorClassName="bg-gradient-to-r from-green-400 to-green-600" />
        </div>

        {group.leader && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={group.leader.profileImageUrl || undefined} alt={group.leader.firstName} />
              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                {group.leader.firstName?.charAt(0) || "ق"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              القائد: {group.leader.firstName} {group.leader.lastName}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        {isMember ? (
          <>
            <Button variant="outline" className="flex-1 gap-2 text-primary hover:bg-primary/5 border-primary/50" asChild>
              <Link href={`/groups/${group.id}`} data-testid={`button-enter-group-${group.id}`}>
                دخول
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            {!isLeader && onLeave && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onLeave(group.id)}
                disabled={isLeaving}
                data-testid={`button-leave-group-${group.id}`}
                className="text-red-500 hover:text-red-700"
              >
                <LeaveIcon className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <Button
            className="w-full gap-2 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-300 ease-in-out"
            onClick={() => onJoin?.(group.id)}
            disabled={isFull || isJoining}
            data-testid={`button-join-group-${group.id}`}
          >
            {isJoining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الانضمام...
              </>
            ) : isFull ? (
              <>
                <Users className="h-4 w-4" />
                مكتملة
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                انضمام
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
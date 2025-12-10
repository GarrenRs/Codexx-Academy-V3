import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Users,
  UserPlus,
  UserMinus,
  Sparkles,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export interface Activity {
  id: string;
  type: "group_created" | "member_joined" | "member_left" | "message_posted" | "task_completed";
  user?: { id: string; firstName: string; lastName: string; profileImageUrl: string | null };
  actor?: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  groupId: number;
  createdAt?: string;
}

export function ActivityFeed({ groupId, createdAt }: ActivityFeedProps) {
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: [`/api/groups/${groupId}/activities`],
  });

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "group_created":
        return <Sparkles className="h-5 w-5 text-blue-500" />;
      case "member_joined":
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case "member_left":
        return <UserMinus className="h-5 w-5 text-red-500" />;
      case "message_posted":
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case "task_completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "group_created":
        return "bg-blue-500/10 text-blue-700";
      case "member_joined":
        return "bg-green-500/10 text-green-700";
      case "member_left":
        return "bg-red-500/10 text-red-700";
      case "message_posted":
        return "bg-purple-500/10 text-purple-700";
      case "task_completed":
        return "bg-emerald-500/10 text-emerald-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
    if (diffHours < 24) return `قبل ${diffHours} ساعة`;
    if (diffDays < 7) return `قبل ${diffDays} أيام`;
    return date.toLocaleDateString("ar");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-3">
      {sortedActivities.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-center">
          <div>
            <Calendar className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">لا توجد أحداث بعد</p>
          </div>
        </div>
      ) : (
        sortedActivities.map((activity) => (
          <div key={activity.id} className="flex gap-4 p-3 rounded-lg border-2 border-emerald-100 dark:border-emerald-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors">
            {/* Timeline Connector */}
            <div className="flex flex-col items-center gap-2">
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center`}>
                {getActivityIcon(activity.type)}
              </div>
            </div>

            {/* Activity Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-right flex-1">{activity.description}</p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTime(activity.timestamp)}
                </span>
              </div>

              {activity.user && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={activity.user.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {activity.user.firstName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {activity.user.firstName} {activity.user.lastName}
                  </span>
                </div>
              )}

              {activity.metadata?.content && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">
                  "{activity.metadata.content}"
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

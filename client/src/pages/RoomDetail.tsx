
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Building2,
  Users,
  MessageSquare,
  ArrowRight,
  UserPlus,
  UserMinus,
  Loader2,
  Activity,
  Crown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatBox } from "@/components/ChatBox";
import { EmptyState } from "@/components/EmptyState";
import { ActivityFeed } from "@/components/ActivityFeed";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Room, User, Group } from "@shared/schema";

interface RoomWithDetails extends Room {
  manager?: User | null;
  members?: Array<{ user: User }>;
  groups?: Group[];
  _count?: { members?: number; groups?: number };
}

const getInitials = (firstName?: string | null, lastName?: string | null) => {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "م";
};

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: room, isLoading } = useQuery<RoomWithDetails>({
    queryKey: [`/api/rooms/${id}`],
    enabled: !!id,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/rooms/${id}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({ title: "تم الانضمام بنجاح" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "غير مصرح", description: "يرجى تسجيل الدخول", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "حدث خطأ", description: "لم نتمكن من الانضمام للغرفة", variant: "destructive" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/rooms/${id}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({ title: "تم المغادرة بنجاح" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "غير مصرح", description: "يرجى تسجيل الدخول", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "حدث خطأ", description: "لم نتمكن من المغادرة", variant: "destructive" });
    },
  });

  const isMember = room?.members?.some((m) => m.user.id === user?.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-red-100 dark:border-red-900">
          <CardContent className="p-12">
            <EmptyState
              icon={<Building2 className="h-12 w-12 text-red-500" />}
              title="غرفة غير موجودة"
              description="الغرفة المطلوبة غير موجودة"
              actionLabel="العودة للغرف"
              onAction={() => navigate("/rooms")}
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
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Button
                variant="ghost"
                onClick={() => navigate("/rooms")}
                className="mb-4 gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-950"
              >
                <ArrowRight className="h-4 w-4" />
                العودة للغرف
              </Button>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-red-600 bg-clip-text text-transparent">
                    {room.name}
                  </h1>
                  <p className="text-muted-foreground mt-1">{room.description || "لا يوجد وصف"}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      {room._count?.members || 0} أعضاء
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      {room._count?.groups || 0} مجموعات
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div>
              {isMember ? (
                <Button
                  variant="destructive"
                  onClick={() => leaveMutation.mutate()}
                  disabled={leaveMutation.isPending}
                  className="gap-2"
                >
                  {leaveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <UserMinus className="h-4 w-4" />
                  مغادرة الغرفة
                </Button>
              ) : (
                <Button
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                >
                  {joinMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <UserPlus className="h-4 w-4" />
                  الانضمام للغرفة
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Section */}
        <Card className="lg:col-span-2 border-2 border-emerald-100 dark:border-emerald-900 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-red-50 dark:from-emerald-950/20 dark:to-red-950/20">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              محادثة الغرفة
            </CardTitle>
            <CardDescription>تواصل مع أعضاء الغرفة</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isMember ? (
              <div className="h-[600px]">
                <ChatBox
                  targetType="room"
                  targetId={room.id}
                  targetName={room.name}
                  currentUser={user}
                />
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center bg-gradient-to-br from-emerald-50/30 to-red-50/30 dark:from-emerald-950/10 dark:to-red-950/10">
                <EmptyState
                  icon={<MessageSquare className="h-8 w-8 text-muted-foreground" />}
                  title="انضم للمشاركة"
                  description="انضم إلى الغرفة للمشاركة في المحادثة"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Members Card */}
          <Card className="border-2 border-red-100 dark:border-red-900">
            <CardHeader className="bg-gradient-to-br from-red-50/50 to-emerald-50/50 dark:from-red-950/20 dark:to-emerald-950/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-red-600" />
                الأعضاء ({room._count?.members || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {room.members && room.members.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {room.members.map(({ user: member }) => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                      <Avatar className="h-10 w-10 border-2 border-red-200 dark:border-red-800">
                        <AvatarImage src={member.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                          {getInitials(member.firstName, member.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.firstName || member.lastName
                            ? `${member.firstName || ""} ${member.lastName || ""}`.trim()
                            : member.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">@{member.username}</p>
                      </div>
                      {member.id === room.managerId && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Crown className="h-3 w-3" />
                          مدير
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">لا يوجد أعضاء</p>
              )}
            </CardContent>
          </Card>

          {/* Activity Card */}
          <Card className="border-2 border-emerald-100 dark:border-emerald-900">
            <CardHeader className="bg-gradient-to-br from-emerald-50/50 to-red-50/50 dark:from-emerald-950/20 dark:to-red-950/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                النشاط الأخير
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ActivityFeed limit={5} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

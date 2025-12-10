
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Share2,
  MessageSquare,
  FileText,
  Calendar,
  Search,
  MoreVertical,
  Activity,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChatBox } from "@/components/ChatBox";
import { ActivityFeed } from "@/components/ActivityFeed";
import { useAuth } from "@/hooks/useAuth";
import type { Group, User } from "@shared/schema";

interface GroupDetailResponse extends Group {
  leader?: User | null;
  members?: Array<{ user: User }>;
  room?: { name: string };
  description?: string;
}

export default function GroupDetail() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const groupId = parseInt(id || "0");

  const { data: group, isLoading } = useQuery<GroupDetailResponse>({
    queryKey: [`/api/groups/${groupId}`],
    enabled: !!groupId && groupId > 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md border-2 border-red-100 dark:border-red-900">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">المجموعة غير موجودة</p>
            <Button variant="outline" onClick={() => window.history.back()}>
              العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const members = group.members || [];
  const leader = group.leader;
  const memberCount = members.length || group._count?.members || 0;
  const progress = (memberCount / (group.maxMembers || 4)) * 100;

  return (
    <div className="space-y-6 pb-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-100 dark:border-emerald-900 p-8 bg-gradient-to-br from-emerald-50/50 via-white to-red-50/30 dark:from-emerald-950/20 dark:via-background dark:to-red-950/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-red-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-red-400/10 to-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-red-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-right bg-gradient-to-r from-emerald-600 to-red-600 bg-clip-text text-transparent">
                  {group.name}
                </h1>
                {group.room?.name && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    في غرفة: {group.room.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 hover:bg-white/50 dark:hover:bg-black/20">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="relative grid grid-cols-3 gap-6 mt-8 pt-6 border-t-2 border-emerald-100/50 dark:border-emerald-900/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              {memberCount}
            </div>
            <p className="text-sm text-muted-foreground font-medium">الأعضاء</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground mb-1">
              {new Date(group.createdAt || "").toLocaleDateString("ar")}
            </div>
            <p className="text-sm text-muted-foreground font-medium">تاريخ الإنشاء</p>
          </div>
          <div className="text-center">
            <Badge 
              variant={group.isActive ? "default" : "secondary"} 
              className={`text-sm px-4 py-1.5 ${group.isActive ? 'bg-gradient-to-r from-green-500 to-emerald-600' : ''}`}
            >
              {group.isActive ? "نشطة" : "معطلة"}
            </Badge>
            <p className="text-sm text-muted-foreground font-medium mt-1">الحالة</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chat Section */}
          <Card className="border-2 border-emerald-100 dark:border-emerald-900 overflow-hidden shadow-lg shadow-emerald-500/5">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-transparent to-red-50/10 dark:from-emerald-950/10 dark:to-red-950/5 pointer-events-none" />
            <CardHeader className="relative bg-gradient-to-r from-emerald-50/50 to-red-50/30 dark:from-emerald-950/20 dark:to-red-950/10 border-b-2 border-emerald-100/50 dark:border-emerald-900/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white shadow-md">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">الرسائل</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative p-0">
              <ChatBox
                targetType="group"
                targetId={groupId}
                targetName={group.name}
                currentUser={currentUser}
              />
            </CardContent>
          </Card>

          {/* Activities Section */}
          <Card className="border-2 border-emerald-100 dark:border-emerald-900 overflow-hidden shadow-lg shadow-emerald-500/5">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-transparent to-red-50/10 dark:from-emerald-950/10 dark:to-red-950/5 pointer-events-none" />
            <CardHeader className="relative bg-gradient-to-r from-emerald-50/50 to-red-50/30 dark:from-emerald-950/20 dark:to-red-950/10 border-b-2 border-emerald-100/50 dark:border-emerald-900/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white shadow-md">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">الأحداث والأنشطة</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    جميع الأحداث منذ إنشاء المجموعة في {group.createdAt ? new Date(group.createdAt).toLocaleDateString("ar") : ""}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-6">
              <ActivityFeed groupId={groupId} createdAt={group.createdAt ? group.createdAt.toString() : undefined} />
            </CardContent>
          </Card>

          {/* Shared Content Section */}
          <Card className="border-2 border-emerald-100 dark:border-emerald-900 overflow-hidden shadow-lg shadow-emerald-500/5">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-transparent to-red-50/10 dark:from-emerald-950/10 dark:to-red-950/5 pointer-events-none" />
            <CardHeader className="relative bg-gradient-to-r from-emerald-50/50 to-red-50/30 dark:from-emerald-950/20 dark:to-red-950/10 border-b-2 border-emerald-100/50 dark:border-emerald-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white shadow-md">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">المحتوى المشترك</CardTitle>
                </div>
                <Button size="sm" variant="outline" className="gap-2 border-2 border-emerald-100 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                  <FileText className="h-4 w-4" />
                  إضافة ملف
                </Button>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center justify-center min-h-[200px] flex-col gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">لا توجد ملفات مشتركة حتى الآن</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Members Section */}
          <Card className="border-2 border-emerald-100 dark:border-emerald-900 overflow-hidden shadow-lg shadow-emerald-500/5">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-transparent to-red-50/10 dark:from-emerald-950/10 dark:to-red-950/5 pointer-events-none" />
            <CardHeader className="relative bg-gradient-to-r from-emerald-50/50 to-red-50/30 dark:from-emerald-950/20 dark:to-red-950/10 border-b-2 border-emerald-100/50 dark:border-emerald-900/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white shadow-md">
                  <Users className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">الأعضاء ({memberCount})</CardTitle>
              </div>
              {memberCount > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">{memberCount} من {group.maxMembers}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-green-600 h-full rounded-full transition-all duration-500 ease-out shadow-md shadow-emerald-500/50" 
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="relative space-y-4 pt-6">
              {memberCount === 0 ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-3">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">لا توجد أعضاء بعد</p>
                </div>
              ) : (
                <>
                  {/* Leader */}
                  {leader && (
                    <>
                      <div className="pb-4 border-b-2 border-emerald-100/50 dark:border-emerald-900/30">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3" />
                          المسؤول
                        </p>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50/50 to-red-50/30 dark:from-emerald-950/20 dark:to-red-950/10 border border-emerald-100 dark:border-emerald-900">
                          <Avatar className="h-10 w-10 border-2 border-white dark:border-background shadow-md">
                            <AvatarImage src={leader.profileImageUrl || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-500 text-white font-semibold">
                              {leader.firstName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate text-right text-foreground">
                              {leader.firstName} {leader.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground text-right truncate">{leader.email}</p>
                          </div>
                          <Badge variant="default" className="whitespace-nowrap bg-gradient-to-r from-emerald-500 to-green-600 shadow-md">
                            مسؤول
                          </Badge>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Other Members */}
                  {members.length > 0 && (
                    <div>
                      {members.length > (leader ? 1 : 0) && (
                        <p className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
                          <Users className="h-3 w-3" />
                          الأعضاء
                        </p>
                      )}
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {members.filter(m => m.user.id !== leader?.id).map((member) => (
                          <div 
                            key={member.user.id} 
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-red-50/20 dark:hover:from-emerald-950/10 dark:hover:to-red-950/5 transition-all duration-200 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/50"
                          >
                            <Avatar className="h-9 w-9 flex-shrink-0 border-2 border-white dark:border-background shadow-sm">
                              <AvatarImage src={member.user.profileImageUrl || undefined} />
                              <AvatarFallback className="text-xs bg-muted text-muted-foreground font-medium">
                                {member.user.firstName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-right">
                                {member.user.firstName} {member.user.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate text-right">{member.user.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Group Info */}
          <Card className="border-2 border-emerald-100 dark:border-emerald-900 overflow-hidden shadow-lg shadow-emerald-500/5">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-transparent to-red-50/10 dark:from-emerald-950/10 dark:to-red-950/5 pointer-events-none" />
            <CardHeader className="relative bg-gradient-to-r from-emerald-50/50 to-red-50/30 dark:from-emerald-950/20 dark:to-red-950/10 border-b-2 border-emerald-100/50 dark:border-emerald-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-500" />
                معلومات المجموعة
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4 text-sm pt-6">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <span className="text-muted-foreground font-medium">تاريخ الإنشاء</span>
                <span className="text-right font-semibold text-foreground">
                  {new Date(group.createdAt || "").toLocaleDateString("ar")}
                </span>
              </div>
              <Separator className="bg-emerald-100/50 dark:bg-emerald-900/30" />
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <span className="text-muted-foreground font-medium">الحالة</span>
                <Badge 
                  variant={group.isActive ? "default" : "secondary"}
                  className={group.isActive ? 'bg-gradient-to-r from-green-500 to-emerald-600' : ''}
                >
                  {group.isActive ? "نشطة" : "معطلة"}
                </Badge>
              </div>
              {group.description && (
                <>
                  <Separator className="bg-emerald-100/50 dark:bg-emerald-900/30" />
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-muted-foreground font-medium mb-2">الوصف</p>
                    <p className="text-right text-foreground leading-relaxed">{group.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

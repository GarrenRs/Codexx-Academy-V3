
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Users, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChatBox } from "@/components/ChatBox";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import type { Room, Group, User } from "@shared/schema";
import { cacheConfig } from "@/lib/cacheConfig";

type ChatTarget = { type: "room"; id: number; name: string } | { type: "group"; id: number; name: string } | null;

export default function Messages() {
  const [activeChat, setActiveChat] = useState<ChatTarget>(null);
  const { user } = useAuth();

  const { data: rooms, isLoading: roomsLoading } = useQuery<(Room & { manager?: User | null })[]>({
    queryKey: ["/api/rooms"],
    staleTime: cacheConfig.lists.staleTime,
    gcTime: cacheConfig.lists.gcTime,
    refetchOnWindowFocus: false,
  });

  const { data: groups, isLoading: groupsLoading } = useQuery<(Group & { leader?: User | null; room?: { name: string } })[]>({
    queryKey: ["/api/groups"],
    staleTime: cacheConfig.lists.staleTime,
    gcTime: cacheConfig.lists.gcTime,
    refetchOnWindowFocus: false,
  });

  const isLoading = roomsLoading || groupsLoading;

  return (
    <div className="space-y-6 h-full">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-purple-100 dark:border-purple-900 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        <div className="relative p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="px-4 py-2 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                <span className="text-purple-700 dark:text-purple-300">تواصل فوري</span>
              </Badge>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-xl">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  فضاء الدردشة
                </h1>
                <p className="text-muted-foreground text-lg mt-1">تواصل مع فريقك وشارك الأفكار</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-20rem)]">
        <div className="lg:col-span-1 border-2 border-purple-100 dark:border-purple-900 rounded-2xl bg-card overflow-hidden shadow-lg">
          <Tabs defaultValue="rooms" className="h-full flex flex-col">
            <TabsList className="w-full grid grid-cols-2 rounded-none border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <TabsTrigger value="rooms" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900" data-testid="tab-rooms">
                <Building2 className="h-4 w-4" />
                الغرف
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900" data-testid="tab-groups">
                <Users className="h-4 w-4" />
                المجموعات
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="rooms" className="flex-1 m-0">
              <ScrollArea className="h-full">
                {isLoading ? (
                  <div className="p-4 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : rooms && rooms.length > 0 ? (
                  <div className="p-2">
                    {rooms.map((room) => (
                      <Button
                        key={room.id}
                        variant={activeChat?.type === "room" && activeChat.id === room.id ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3 h-16 mb-2"
                        onClick={() => setActiveChat({ type: "room", id: room.id, name: room.name })}
                        data-testid={`button-chat-room-${room.id}`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{room.name}</span>
                          <span className="text-xs text-muted-foreground">غرفة تخصص</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">لا توجد غرف</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="groups" className="flex-1 m-0">
              <ScrollArea className="h-full">
                {isLoading ? (
                  <div className="p-4 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : groups && groups.length > 0 ? (
                  <div className="p-2">
                    {groups.map((group) => (
                      <Button
                        key={group.id}
                        variant={activeChat?.type === "group" && activeChat.id === group.id ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3 h-16 mb-2"
                        onClick={() => setActiveChat({ type: "group", id: group.id, name: group.name })}
                        data-testid={`button-chat-group-${group.id}`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-md">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{group.name}</span>
                          <span className="text-xs text-muted-foreground">{group.room?.name || "مجموعة"}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">لا توجد مجموعات</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-2 border-2 border-pink-100 dark:border-pink-900 rounded-2xl bg-card overflow-hidden shadow-lg">
          {activeChat ? (
            <div className="h-full flex flex-col">
              <div className="border-b bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 p-6">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-xl ${activeChat.type === 'room' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-pink-500 to-pink-600'} flex items-center justify-center text-white shadow-md`}>
                    {activeChat.type === 'room' ? <Building2 className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl">{activeChat.name}</h3>
                    <p className="text-sm text-muted-foreground">{activeChat.type === "room" ? "غرفة تخصص" : "مجموعة عمل"}</p>
                  </div>
                </div>
              </div>
              <ChatBox
                targetType={activeChat.type}
                targetId={activeChat.id}
                targetName={activeChat.name}
                currentUser={user}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-950/10 dark:to-pink-950/10">
              <EmptyState
                icon={<MessageSquare className="h-16 w-16 text-muted-foreground/50" />}
                title="اختر محادثة"
                description="اختر غرفة أو مجموعة لبدء المحادثة والتواصل مع فريقك"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Users, Building2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatBox } from "@/components/ChatBox";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { cacheConfig } from "@/lib/cacheConfig";
import type { Room, Group, User } from "@shared/schema";

type ChatTarget = 
  | { type: "group"; id: number; name: string } 
  | { type: "room"; id: number; name: string } 
  | { type: "management"; id: string; name: string }
  | null;

export default function ChatSpaceView() {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState<ChatTarget>(null);

  // Fetch user's groups (for members and team leaders)
  const { data: userGroups } = useQuery<(Group & { room?: { name: string } })[]>({
    queryKey: ["/api/user/groups"],
    enabled: user?.role === "member" || user?.role === "team_leader",
    staleTime: cacheConfig.lists.staleTime,
  });

  // Fetch rooms (for room managers)
  const { data: rooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
    enabled: user?.role === "room_manager" || user?.role === "team_leader",
    staleTime: cacheConfig.lists.staleTime,
  });

  const canAccessManagementChat = user?.role === "admin" || user?.role === "room_manager";
  const canAccessRoomChat = user?.role === "room_manager" || user?.role === "team_leader";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">فضاء الدردشة</h2>
        <p className="text-muted-foreground">تواصل مع فريقك حسب صلاحياتك</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Chat List */}
        <Card className="lg:col-span-1 overflow-hidden">
          <Tabs defaultValue="my-chats">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="my-chats">محادثاتي</TabsTrigger>
              {canAccessManagementChat && (
                <TabsTrigger value="management">الإدارة</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="my-chats" className="m-0">
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-2">
                  {/* Member & Team Leader: Show their groups */}
                  {(user?.role === "member" || user?.role === "team_leader") && userGroups && (
                    <>
                      <div className="text-sm font-medium text-muted-foreground mb-2 px-2">
                        مجموعاتي
                      </div>
                      {userGroups.map((group) => (
                        <Button
                          key={group.id}
                          variant={
                            activeChat?.type === "group" && activeChat.id === group.id
                              ? "secondary"
                              : "ghost"
                          }
                          className="w-full justify-start gap-3"
                          onClick={() =>
                            setActiveChat({ type: "group", id: group.id, name: group.name })
                          }
                        >
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                            <Users className="h-5 w-5" />
                          </div>
                          <div className="flex-1 text-right">
                            <div className="font-medium">{group.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {group.room?.name}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </>
                  )}

                  {/* Team Leader & Room Manager: Show rooms */}
                  {canAccessRoomChat && rooms && (
                    <>
                      <div className="text-sm font-medium text-muted-foreground mb-2 px-2 mt-4">
                        غرف التخصصات
                      </div>
                      {rooms.map((room) => (
                        <Button
                          key={room.id}
                          variant={
                            activeChat?.type === "room" && activeChat.id === room.id
                              ? "secondary"
                              : "ghost"
                          }
                          className="w-full justify-start gap-3"
                          onClick={() =>
                            setActiveChat({ type: "room", id: room.id, name: room.name })
                          }
                        >
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="flex-1 text-right">
                            <div className="font-medium">{room.name}</div>
                            <div className="text-xs text-muted-foreground">غرفة تخصص</div>
                          </div>
                        </Button>
                      ))}
                    </>
                  )}

                  {!userGroups?.length && !rooms?.length && (
                    <div className="p-8 text-center text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">لا توجد محادثات متاحة</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {canAccessManagementChat && (
              <TabsContent value="management" className="m-0">
                <ScrollArea className="h-[600px]">
                  <div className="p-4 space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2 px-2">
                      فضاء الإدارة
                    </div>
                    <Button
                      variant={
                        activeChat?.type === "management"
                          ? "secondary"
                          : "ghost"
                      }
                      className="w-full justify-start gap-3"
                      onClick={() =>
                        setActiveChat({
                          type: "management",
                          id: "management-chat",
                          name: "غرفة الإدارة",
                        })
                      }
                    >
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-medium">غرفة الإدارة</div>
                        <div className="text-xs text-muted-foreground">
                          قادة الغرف والمشرفين
                        </div>
                      </div>
                    </Button>
                  </div>
                </ScrollArea>
              </TabsContent>
            )}
          </Tabs>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 overflow-hidden">
          {activeChat ? (
            <div className="h-[700px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-3">
                  <div
                    className={`h-12 w-12 rounded-lg ${
                      activeChat.type === "group"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600"
                        : activeChat.type === "room"
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                        : "bg-gradient-to-br from-purple-500 to-purple-600"
                    } flex items-center justify-center text-white`}
                  >
                    {activeChat.type === "group" ? (
                      <Users className="h-6 w-6" />
                    ) : activeChat.type === "room" ? (
                      <Building2 className="h-6 w-6" />
                    ) : (
                      <Shield className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{activeChat.name}</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      {activeChat.type === "group"
                        ? "مجموعة عمل"
                        : activeChat.type === "room"
                        ? "غرفة تخصص"
                        : "فضاء الإدارة"}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <div className="flex-1 overflow-hidden">
                {activeChat.type === "management" ? (
                  <div className="h-full flex items-center justify-center p-8">
                    <EmptyState
                      icon={<Shield className="h-16 w-16 text-purple-500" />}
                      title="غرفة الإدارة"
                      description="فضاء خاص للتواصل بين قادة الغرف والمشرفين"
                    />
                  </div>
                ) : (
                  <ChatBox
                    targetType={activeChat.type}
                    targetId={activeChat.id}
                    targetName={activeChat.name}
                    currentUser={user}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="h-[700px] flex items-center justify-center">
              <EmptyState
                icon={<MessageSquare className="h-16 w-16 text-muted-foreground/50" />}
                title="اختر محادثة"
                description="اختر محادثة من القائمة للبدء بالتواصل"
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

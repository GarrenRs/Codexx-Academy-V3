import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Users, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GroupCard } from "@/components/GroupCard";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Group, User, Room } from "@shared/schema";

const createGroupSchema = z.object({
  name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  roomId: z.string().min(1, "يجب اختيار غرفة"),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;

export default function Groups() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: groups, isLoading } = useQuery<(Group & { 
    leader?: User | null; 
    members?: Array<{ user: User }>; 
    room?: { name: string };
    _count?: { members?: number };
  })[]>({
    queryKey: ["/api/groups"],
  });

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const form = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      roomId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      return apiRequest("POST", "/api/groups", {
        name: data.name,
        roomId: parseInt(data.roomId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "تم إنشاء المجموعة بنجاح" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "غير مصرح", description: "يرجى تسجيل الدخول", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "حدث خطأ", description: "لم نتمكن من إنشاء المجموعة", variant: "destructive" });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (groupId: number) => {
      return apiRequest("POST", `/api/groups/${groupId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/groups"] });
      toast({ title: "✅ تم الانضمام بنجاح", description: "تم إضافتك للمجموعة" });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "غير مصرح", description: "يرجى تسجيل الدخول", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      const message = error?.response?.data?.message || "لم نتمكن من الانضمام للمجموعة";
      toast({ title: "❌ خطأ", description: message, variant: "destructive" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (groupId: number) => {
      return apiRequest("POST", `/api/groups/${groupId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/groups"] });
      toast({ title: "✅ تم المغادرة بنجاح", description: "تم إزالتك من المجموعة" });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "غير مصرح", description: "يرجى تسجيل الدخول", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      const message = error?.response?.data?.message || "لم نتمكن من المغادرة";
      toast({ title: "❌ خطأ", description: message, variant: "destructive" });
    },
  });

  const filteredGroups = groups?.filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (data: CreateGroupForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-red-100 dark:border-red-900">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/80 via-background to-emerald-50/80 dark:from-red-950/30 dark:via-background dark:to-emerald-950/30" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-emerald-600 bg-clip-text text-transparent">
                  المجموعات
                </h1>
              </div>
              <p className="text-muted-foreground">استعرض المجموعات المتاحة وانضم إلى فريق عمل</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800" data-testid="button-create-group">
                  <Plus className="h-4 w-4" />
                  إنشاء مجموعة
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء مجموعة جديدة</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المجموعة</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: فريق النجوم" {...field} data-testid="input-group-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الغرفة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-group-room">
                              <SelectValue placeholder="اختر الغرفة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rooms?.map((room) => (
                              <SelectItem key={room.id} value={room.id.toString()}>
                                {room.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-group"
                  >
                    {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    إنشاء المجموعة
                  </Button>
                </form>
              </Form>
            </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن مجموعة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
            data-testid="input-search-groups"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : filteredGroups && filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <div 
              key={group.id}
              className="cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <GroupCard
                group={group}
                currentUserId={user?.id}
                onJoin={(id) => {
                  id === group.id && joinMutation.mutate(id);
                }}
                onLeave={(id) => {
                  id === group.id && leaveMutation.mutate(id);
                }}
                isJoining={joinMutation.isPending}
                isLeaving={leaveMutation.isPending}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-8 w-8 text-muted-foreground" />}
          title="لا توجد مجموعات"
          description={search ? "لم يتم العثور على مجموعات تطابق البحث" : "لم يتم إنشاء أي مجموعات بعد"}
          actionLabel="إنشاء مجموعة"
          onAction={() => setIsDialogOpen(true)}
        />
      )}
    </div>
  );
}

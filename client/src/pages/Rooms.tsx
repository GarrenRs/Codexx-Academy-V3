import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Building2, Search, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { RoomCard } from "@/components/RoomCard";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { queryClient, apiRequest, cacheConfig } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Room, User } from "@shared/schema";

const createRoomSchema = z.object({
  name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  description: z.string().optional(),
  icon: z.string().default("code"),
});

type CreateRoomForm = z.infer<typeof createRoomSchema>;

const iconOptions = [
  { value: "code", label: "تطوير الويب" },
  { value: "palette", label: "التصميم" },
  { value: "trending", label: "التسويق" },
  { value: "briefcase", label: "إدارة الأعمال" },
  { value: "database", label: "البيانات" },
  { value: "megaphone", label: "الإعلام" },
];

export default function Rooms() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: rooms, isLoading } = useQuery<(Room & { manager?: User | null; _count?: { groups?: number; members?: number } })[]>({
    queryKey: ["/api/rooms"],
    staleTime: cacheConfig.lists.staleTime,
    gcTime: cacheConfig.lists.gcTime,
  });

  const form = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "code",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateRoomForm) => {
      return apiRequest("POST", "/api/rooms", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({ title: "تم إنشاء الغرفة بنجاح" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "حدث خطأ", description: "لم نتمكن من إنشاء الغرفة", variant: "destructive" });
    },
  });

  const filteredRooms = rooms?.filter((room) =>
    room.name.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (data: CreateRoomForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-100 dark:border-emerald-900">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-background to-red-50/80 dark:from-emerald-950/30 dark:via-background dark:to-red-950/30" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-red-600 bg-clip-text text-transparent">
                  غرف التخصصات
                </h1>
              </div>
              <p className="text-muted-foreground">استعرض الغرف المتاحة وانضم إلى التخصص المناسب لك</p>
            </div>
            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800" data-testid="button-create-room">
                    <Plus className="h-4 w-4" />
                    إنشاء غرفة
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إنشاء غرفة جديدة</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم الغرفة</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: تطوير الويب" {...field} data-testid="input-room-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>التخصص</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-room-icon">
                                <SelectValue placeholder="اختر التخصص" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {iconOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الوصف</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="وصف مختصر للغرفة..."
                              {...field}
                              data-testid="textarea-room-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createMutation.isPending}
                      data-testid="button-submit-room"
                    >
                      {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                      إنشاء الغرفة
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن غرفة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
            data-testid="input-search-rooms"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredRooms && filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Building2 className="h-8 w-8 text-muted-foreground" />}
          title="لا توجد غرف"
          description={search ? "لم يتم العثور على غرف تطابق البحث" : "لم يتم إنشاء أي غرف بعد"}
          actionLabel={isAdmin ? "إنشاء غرفة" : undefined}
          onAction={isAdmin ? () => setIsDialogOpen(true) : undefined}
        />
      )}
    </div>
  );
}

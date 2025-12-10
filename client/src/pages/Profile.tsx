import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Mail, Calendar, Shield, Edit2, Save, X, Loader2, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/PageHeader";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@shared/schema";

const profileSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل").optional(),
  lastName: z.string().min(2, "الاسم الأخير يجب أن يكون حرفين على الأقل").optional(),
  bio: z.string().max(500, "الوصف لا يجب أن يتجاوز 500 حرف").optional(),
  skills: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const roleLabels: Record<UserRole, string> = {
  admin: "مدير المنصة",
  room_manager: "مدير غرفة",
  team_leader: "قائد فريق",
  member: "عضو",
};

const getInitials = (firstName?: string | null, lastName?: string | null) => {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "م";
};

export default function Profile() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: user?.bio || "",
      skills: user?.skills?.join(", ") || "",
    },
    values: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: user?.bio || "",
      skills: user?.skills?.join(", ") || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const skills = data.skills
        ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      return apiRequest("PATCH", "/api/auth/user", {
        ...data,
        skills,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "تم حفظ التغييرات بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ", description: "لم نتمكن من حفظ التغييرات", variant: "destructive" });
    },
  });

  const onSubmit = (data: ProfileForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-100 dark:border-emerald-900">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-background to-red-50/80 dark:from-emerald-950/30 dark:via-background dark:to-red-950/30" />
          <div className="relative p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-red-600 bg-clip-text text-transparent">
                  الملف الشخصي
                </h1>
                <p className="text-muted-foreground mt-1">إدارة معلوماتك الشخصية</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-100 dark:border-emerald-900">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-background to-red-50/80 dark:from-emerald-950/30 dark:via-background dark:to-red-950/30" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-red-600 bg-clip-text text-transparent">
                الملف الشخصي
              </h1>
              <p className="text-muted-foreground mt-1">إدارة معلوماتك الشخصية</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-2 border-emerald-100 dark:border-emerald-900 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-transparent to-red-50/20 dark:from-emerald-950/10 dark:to-red-950/10 pointer-events-none" />
          <CardHeader className="relative bg-gradient-to-br from-emerald-50/50 to-red-50/50 dark:from-emerald-950/20 dark:to-red-950/20">
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              الصورة الشخصية
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-lg">
              {user?.firstName || user?.lastName
                ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
                : "مستخدم"}
            </h3>
            <Badge variant="secondary" className="mt-2">
              {roleLabels[(user?.role || "member") as UserRole]}
            </Badge>

            <Separator className="my-6" />

            <div className="w-full space-y-4 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user?.email || "لم يتم تحديد البريد"}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>{roleLabels[(user?.role || "member") as UserRole]}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("ar-SA")
                    : "غير محدد"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-2 border-red-100 dark:border-red-900 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/20 via-transparent to-emerald-50/20 dark:from-red-950/10 dark:to-emerald-950/10 pointer-events-none" />
          <CardHeader className="relative flex flex-row items-center justify-between bg-gradient-to-br from-red-50/50 to-emerald-50/50 dark:from-red-950/20 dark:to-emerald-950/20">
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                <Edit2 className="h-4 w-4 text-white" />
              </div>
              المعلومات الشخصية
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الأول</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="أدخل اسمك الأول"
                            {...field}
                            data-testid="input-first-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الأخير</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="أدخل اسمك الأخير"
                            {...field}
                            data-testid="input-last-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نبذة عنك</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="اكتب نبذة مختصرة عنك..."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-bio"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المهارات</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: JavaScript, Python, التصميم (افصل بين المهارات بفاصلة)"
                          {...field}
                          data-testid="input-skills"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="gap-2"
                  disabled={updateMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  حفظ التغييرات
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
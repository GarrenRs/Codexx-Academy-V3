
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Edit2, 
  Save, 
  Award,
  Target,
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { UserRole } from "@shared/schema";

const roleLabels: Record<UserRole, string> = {
  admin: "مشرف المنصة",
  room_manager: "قائد غرفة",
  team_leader: "قائد مجموعة",
  member: "عضو",
};

const getInitials = (firstName?: string | null, lastName?: string | null) => {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "م";
};

export default function ProfileView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: user?.bio || "",
    skills: user?.skills?.join(", ") || "",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
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
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="border-2 border-emerald-100 dark:border-emerald-900 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-500 via-teal-500 to-red-500" />
        <CardContent className="relative pt-0 pb-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
            <Avatar className="h-32 w-32 border-4 border-white dark:border-slate-900 shadow-xl">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-3xl">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-right">
              <h2 className="text-3xl font-bold">
                {user?.firstName || user?.lastName
                  ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
                  : "مستخدم"}
              </h2>
              <Badge variant="secondary" className="mt-2">
                {roleLabels[(user?.role || "member") as UserRole]}
              </Badge>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              className="gap-2"
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4" onClick={handleSave} />
                  حفظ
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4" />
                  تعديل
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Personal Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              المعلومات الشخصية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">الاسم الأول</label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">الاسم الأخير</label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">نبذة عنك</label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">المهارات (افصل بفاصلة)</label>
                  <Input
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="JavaScript, React, Node.js"
                  />
                </div>
              </>
            ) : (
              <>
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
                    انضم في {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("ar-SA")
                      : "غير محدد"}
                  </span>
                </div>
                {user?.bio && (
                  <div className="pt-4">
                    <h4 className="font-semibold mb-2">نبذة</h4>
                    <p className="text-muted-foreground">{user.bio}</p>
                  </div>
                )}
                {user?.skills && user.skills.length > 0 && (
                  <div className="pt-4">
                    <h4 className="font-semibold mb-2">المهارات</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats & Achievements */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" />
                التقدم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>إنجاز المهام</span>
                  <span className="font-semibold">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>المشاركة</span>
                  <span className="font-semibold">60%</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5" />
                الشارات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mx-auto mb-2">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <p className="text-xs">مبتدئ</p>
                </div>
                <div className="text-center opacity-50">
                  <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-xs">متقدم</p>
                </div>
                <div className="text-center opacity-50">
                  <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-xs">خبير</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

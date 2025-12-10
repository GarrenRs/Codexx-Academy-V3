import { useLocation, Link } from "wouter";
import {
  Home,
  Users,
  FolderKanban,
  ListTodo,
  MessageSquare,
  Vote,
  Settings as SettingsIcon,
  LogOut,
  Building2,
  UserCircle,
  TrendingUp,
} from "lucide-react";

const Settings = SettingsIcon;
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { UserRole } from "@shared/schema";

const getInitials = (firstName?: string | null, lastName?: string | null) => {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "م";
};

const getRoleLabel = (role: UserRole) => {
  const labels: Record<UserRole, string> = {
    admin: "مدير المنصة",
    room_manager: "مدير غرفة",
    team_leader: "قائد فريق",
    member: "عضو",
  };
  return labels[role] || "عضو";
};

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const mainNavItems: NavItem[] = [
  { title: "الرئيسية", url: "/", icon: Home },
  { title: "لوحة التحكم", url: "/home", icon: Settings },
  { title: "فضاء الدردشة", url: "/messages", icon: MessageSquare },
  { title: "الغرف", url: "/rooms", icon: Building2 },
  { title: "المجموعات", url: "/groups", icon: Users },
  { title: "المشاريع", url: "/projects", icon: FolderKanban },
  { title: "المهام", url: "/tasks", icon: ListTodo },
  { title: "المدونة", url: "/blog", icon: TrendingUp },
];

const managementNavItems: NavItem[] = [
  { title: "التصويت", url: "/voting", icon: Vote, roles: ["admin", "room_manager"] },
  { title: "لوحة التحكم", url: "/admin", icon: Settings, roles: ["admin"] },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const userRole = (user?.role || "member") as UserRole;

  const filteredManagementItems = managementNavItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      if (response.ok) {
        toast({
          title: "تم تسجيل الخروج",
          description: "نراك قريباً!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "تحذير",
          description: "قد لم يتم تسجيل الخروج بشكل كامل",
        });
      }
      setLocation("/");
    } catch (error) {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في تسجيل الخروج",
      });
      setLocation("/");
    }
  };

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-red-600 bg-clip-text text-transparent">أكاديمية التدريب</span>
            <span className="text-xs text-muted-foreground">منصة التعلم التعاوني</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.url.slice(1) || 'home'}`}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredManagementItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>الإدارة</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredManagementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      tooltip={item.title}
                    >
                      <Link href={item.url} data-testid={`link-nav-${item.url.slice(1)}`}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-medium text-sm">
              {user?.firstName || user?.lastName
                ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
                : "مستخدم"}
            </span>
            <span className="text-xs text-muted-foreground">
              {getRoleLabel(userRole)}
            </span>
          </div>
          <div className="flex gap-1 group-data-[collapsible=icon]:hidden">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/profile" data-testid="link-profile">
                <UserCircle className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
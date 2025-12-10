import { Link } from "wouter";
import { Users, FolderOpen, ArrowLeft, Code, Palette, TrendingUp, Briefcase, Megaphone, Database } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Room, User } from "@shared/schema";

interface RoomCardProps {
  room: Room & { manager?: User | null; _count?: { groups?: number; members?: number } };
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  code: Code,
  palette: Palette,
  trending: TrendingUp,
  briefcase: Briefcase,
  megaphone: Megaphone,
  database: Database,
};

export function RoomCard({ room }: RoomCardProps) {
  const Icon = iconMap[room.icon || "code"] || Code;
  const groupCount = room._count?.groups || 0;
  const memberCount = room._count?.members || 0;

  return (
    <Link href={`/rooms/${room.id}`}>
      <Card className="h-full cursor-pointer card-hover border-gradient-emerald shadow-lg" data-testid={`room-card-${room.id}`}>
        <div className="absolute top-0 left-0 w-full h-1 gradient-emerald-teal"></div>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-emerald-teal text-white shadow-lg glow-emerald">
              <Icon className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold">{room.name}</CardTitle>
          </div>
          <CardDescription className="mt-2 text-sm">
            {room.description || "لا يوجد وصف"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1 smooth-transition hover:text-emerald-600">
              <FolderOpen className="h-4 w-4" />
              <span>{groupCount} مجموعة</span>
            </div>
            <div className="flex items-center gap-1 smooth-transition hover:text-emerald-600">
              <Users className="h-4 w-4" />
              <span>{memberCount} عضو</span>
            </div>
          </div>
        </CardContent>
        {room.manager && (
          <CardFooter className="flex items-center gap-2 pt-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={room.manager.profileImageUrl || undefined} />
              <AvatarFallback className="text-xs bg-muted">
                {room.manager.firstName?.charAt(0) || "م"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              المدير: {room.manager.firstName} {room.manager.lastName}
            </span>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
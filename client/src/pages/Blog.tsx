
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  MessageSquare, 
  ThumbsUp, 
  Calendar,
  User as UserIcon,
  Send,
  Newspaper,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface BlogPost {
  id: number;
  title: string;
  content: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
    role: string;
  };
  createdAt: string;
  _count?: {
    comments?: number;
    likes?: number;
  };
  userLiked?: boolean;
}

interface Comment {
  id: number;
  content: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
  createdAt: string;
}

export default function Blog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");

  // Placeholder data - في التطبيق الحقيقي سيتم جلبها من API
  const posts: BlogPost[] = [
    {
      id: 1,
      title: "مرحباً بكم في أكاديمية المهارات الجزائرية",
      content: "نحن سعداء بإطلاق منصتنا الجديدة للتدريب التعاوني. انضموا إلينا في رحلة التعلم والتطوير المهني.",
      author: {
        id: "1",
        firstName: "مسؤول",
        lastName: "النظام",
        profileImageUrl: null,
        role: "admin"
      },
      createdAt: new Date().toISOString(),
      _count: { comments: 5, likes: 12 },
      userLiked: false
    }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-purple-100 dark:border-purple-900 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 via-background to-pink-50/80 dark:from-purple-950/30 dark:via-background dark:to-pink-950/30" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              <Newspaper className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                مدونة الأكاديمية
              </h1>
              <p className="text-muted-foreground mt-1">آخر الأخبار والتحديثات والمقالات</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Blog Posts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post (Admin only) */}
          {isAdmin && (
            <Card className="border-2 border-purple-100 dark:border-purple-900">
              <CardHeader className="bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
                <CardTitle className="text-lg">نشر مقال جديد</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <input
                  type="text"
                  placeholder="عنوان المقال"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border bg-background"
                />
                <Textarea
                  placeholder="محتوى المقال..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Send className="h-4 w-4 ml-2" />
                  نشر المقال
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Blog Posts List */}
          {posts.map((post) => (
            <Card key={post.id} className="border-2 border-purple-100 dark:border-purple-900 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.profileImageUrl || undefined} />
                      <AvatarFallback>{post.author.firstName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg">{post.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>{post.author.firstName} {post.author.lastName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={post.author.role === "admin" ? "default" : "secondary"}>
                    {post.author.role === "admin" ? "مسؤول" : "عضو"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{post.content}</p>
                
                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button 
                    variant={post.userLiked ? "default" : "outline"} 
                    size="sm" 
                    className="gap-2"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {post._count?.likes || 0}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {post._count?.comments || 0} تعليق
                  </Button>
                </div>

                {/* Comments Section */}
                {selectedPost === post.id && (
                  <div className="pt-4 border-t space-y-4">
                    <h4 className="font-semibold">التعليقات</h4>
                    
                    {/* Add Comment */}
                    <div className="flex gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl || undefined} />
                        <AvatarFallback>{user?.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <Textarea
                          placeholder="اكتب تعليقك..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={2}
                          className="resize-none"
                        />
                        <Button size="sm" className="self-end">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Comments List - Placeholder */}
                    <div className="space-y-3">
                      <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>م</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">مستخدم</span>
                            <span className="text-xs text-muted-foreground">قبل ساعة</span>
                          </div>
                          <p className="text-sm">مقال رائع! شكراً على المشاركة</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Topics */}
          <Card className="border-2 border-pink-100 dark:border-pink-900">
            <CardHeader className="bg-gradient-to-br from-pink-50/50 to-transparent dark:from-pink-950/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                المواضيع الرائجة
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {["التطوير الشخصي", "البرمجة", "التصميم", "التسويق الرقمي"].map((topic, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <span className="text-sm font-medium">#{topic}</span>
                    <Badge variant="secondary">{Math.floor(Math.random() * 20) + 5}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-2 border-purple-100 dark:border-purple-900">
            <CardHeader className="bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                النشاط الأخير
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">م</AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">علق على مقال</span>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">أ</AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">أعجب بمقال</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

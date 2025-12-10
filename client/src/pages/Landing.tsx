
import { Link } from "wouter";
import { ArrowLeft, Users, FolderKanban, MessageSquare, Target, Zap, Code, Palette, TrendingUp, ShoppingCart, Megaphone, Lightbulb, Award, BookOpen, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState, useRef } from "react";

const features = [
  {
    icon: Users,
    title: "فرق عمل متخصصة",
    description: "انضم إلى فرق من 4 أعضاء في تخصصات متنوعة",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: FolderKanban,
    title: "مشاريع واقعية",
    description: "طور مهاراتك من خلال مشاريع عملية حقيقية",
    color: "from-red-500 to-rose-600",
  },
  {
    icon: MessageSquare,
    title: "تواصل مباشر",
    description: "تفاعل مع فريقك وتابع التقدم لحظياً",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Award,
    title: "شهادات إنجاز",
    description: "احصل على شهادات عند إتمام المشاريع",
    color: "from-red-500 to-rose-600",
  },
];

const services = [
  { icon: Code, name: "البرمجة والتطوير", color: "text-emerald-600 dark:text-emerald-400" },
  { icon: Palette, name: "التصميم الإبداعي", color: "text-red-600 dark:text-red-400" },
  { icon: Megaphone, name: "التسويق الرقمي", color: "text-emerald-600 dark:text-emerald-400" },
  { icon: ShoppingCart, name: "التجارة الإلكترونية", color: "text-red-600 dark:text-red-400" },
  { icon: TrendingUp, name: "إدارة المشاريع", color: "text-emerald-600 dark:text-emerald-400" },
  { icon: Lightbulb, name: "الابتكار وريادة الأعمال", color: "text-red-600 dark:text-red-400" },
];

const steps = [
  { 
    number: "1", 
    title: "سجل مجاناً", 
    description: "أنشئ حسابك واختر المجال الذي يناسب اهتماماتك",
    icon: BookOpen,
  },
  { 
    number: "2", 
    title: "انضم لفريق", 
    description: "انضم لفريق من 4 أعضاء أو شكل فريقك الخاص",
    icon: Users,
  },
  { 
    number: "3", 
    title: "ابدأ التعلم", 
    description: "شارك في المشاريع واكتسب خبرة عملية قيمة",
    icon: Target,
  },
  { 
    number: "4", 
    title: "طور مهاراتك", 
    description: "احصل على تقييمات وشهادات لتطور مهاراتك المهنية",
    icon: Award,
  },
];

const stats = [
  { value: "100%", label: "مجاني تماماً" },
  { value: "4", label: "أعضاء في كل فريق" },
  { value: "24/7", label: "دعم مستمر" },
  { value: "∞", label: "فرص لا محدودة" },
];

function FloatingIcon({ icon: Icon, className = "", delay = 0 }: { icon: any; className?: string; delay?: number }) {
  return (
    <div 
      className={`absolute ${className}`}
      style={{
        animation: `float 6s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <Icon className="h-12 w-12 opacity-20" />
    </div>
  );
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number[];
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize animated network nodes
  useEffect(() => {
    const nodeCount = 30;
    const initialNodes: Node[] = [];
    
    for (let i = 0; i < nodeCount; i++) {
      initialNodes.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        connections: []
      });
    }
    
    setNodes(initialNodes);
  }, []);

  // Animate nodes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    updateCanvas();
    window.addEventListener('resize', updateCanvas);

    const animate = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw nodes
      setNodes(prevNodes => {
        const updatedNodes = prevNodes.map(node => {
          let newX = node.x + node.vx;
          let newY = node.y + node.vy;
          let newVx = node.vx;
          let newVy = node.vy;

          if (newX < 0 || newX > 100) newVx = -newVx;
          if (newY < 0 || newY > 100) newVy = -newVy;
          
          newX = Math.max(0, Math.min(100, newX));
          newY = Math.max(0, Math.min(100, newY));

          return { ...node, x: newX, y: newY, vx: newVx, vy: newVy };
        });

        // Draw connections
        const isDark = document.documentElement.classList.contains('dark');
        ctx.strokeStyle = isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.2)';
        ctx.lineWidth = 1;

        for (let i = 0; i < updatedNodes.length; i++) {
          for (let j = i + 1; j < updatedNodes.length; j++) {
            const dx = updatedNodes[j].x - updatedNodes[i].x;
            const dy = updatedNodes[j].y - updatedNodes[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 15) {
              const opacity = (1 - distance / 15) * 0.5;
              ctx.strokeStyle = isDark 
                ? `rgba(16, 185, 129, ${opacity * 0.3})` 
                : `rgba(16, 185, 129, ${opacity * 0.4})`;
              
              ctx.beginPath();
              ctx.moveTo(
                (updatedNodes[i].x / 100) * canvas.width,
                (updatedNodes[i].y / 100) * canvas.height
              );
              ctx.lineTo(
                (updatedNodes[j].x / 100) * canvas.width,
                (updatedNodes[j].y / 100) * canvas.height
              );
              ctx.stroke();
            }
          }
        }

        // Draw nodes
        updatedNodes.forEach(node => {
          const x = (node.x / 100) * canvas.width;
          const y = (node.y / 100) * canvas.height;
          
          // Glow effect
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
          gradient.addColorStop(0, isDark ? 'rgba(16, 185, 129, 0.6)' : 'rgba(16, 185, 129, 0.8)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Core
          ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.9)' : 'rgba(16, 185, 129, 1)';
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        return updatedNodes;
      });

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', updateCanvas);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .gradient-text {
          background: linear-gradient(135deg, #059669 0%, #dc2626 50%, #059669 100%);
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Header */}
      <header className={`sticky top-0 z-50 smooth-transition ${scrolled ? 'glass-effect border-b shadow-lg' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl gradient-emerald-red shadow-lg hover:scale-110 smooth-transition">
              <Zap className="h-6 w-6 text-white" />
              <div className="absolute inset-0 rounded-xl gradient-emerald-red opacity-0 blur-lg smooth-transition hover:opacity-70" />
            </div>
            <div>
              <span className="font-bold text-xl block hover:animated-gradient-text smooth-transition">أكاديمية المهارات</span>
              <span className="text-xs text-muted-foreground">الجزائرية للتدريب المجاني</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" className="smooth-transition hover:border-emerald-600 hover:text-emerald-600" asChild>
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button size="sm" className="btn-gradient-emerald" asChild data-testid="button-login">
              <Link href="/register">ابدأ الآن</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden" onMouseMove={handleMouseMove}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-background to-red-50/50 dark:from-emerald-950/20 dark:via-background dark:to-red-950/20" />
          
          {/* Animated Network Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: 0.6 }}
          />
          
          {/* Floating Icons */}
          <FloatingIcon icon={Code} className="top-20 left-[10%] text-emerald-600" delay={0} />
          <FloatingIcon icon={Palette} className="top-40 right-[15%] text-red-600" delay={1} />
          <FloatingIcon icon={Megaphone} className="bottom-40 left-[20%] text-emerald-600" delay={2} />
          <FloatingIcon icon={ShoppingCart} className="bottom-20 right-[25%] text-red-600" delay={3} />
          <FloatingIcon icon={TrendingUp} className="top-1/2 left-[5%] text-emerald-600" delay={1.5} />
          <FloatingIcon icon={Lightbulb} className="top-1/3 right-[8%] text-red-600" delay={2.5} />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                <Star className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">منصة تدريب مجانية 100%</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                <span className="block mb-3">أكاديمية المهارات</span>
                <span className="gradient-text block">الجزائرية</span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                منصة تدريب جماعي مجانية لتطوير مهاراتك المهنية في
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold"> البرمجة</span>،
                <span className="text-red-600 dark:text-red-400 font-semibold"> التصميم</span>،
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold"> التسويق</span>
                والمزيد من خلال العمل على مشاريع حقيقية
              </p>

              {/* Services Icons */}
              <div className="flex flex-wrap justify-center gap-6 py-8">
                {services.map((service, idx) => (
                  <div 
                    key={idx}
                    className="flex flex-col items-center gap-2 group cursor-pointer transition-transform hover:scale-110"
                  >
                    <div className="p-4 rounded-2xl bg-background border shadow-sm group-hover:shadow-md transition-all">
                      <service.icon className={`h-8 w-8 ${service.color}`} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{service.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-600/30" asChild data-testid="button-start">
                  <Link href="/register">
                    ابدأ التعلم المجاني الآن
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2 border-2" asChild>
                  <a href="#features">
                    <Globe className="h-5 w-5" />
                    اكتشف المزيد
                  </a>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">لماذا أكاديمية المهارات الجزائرية؟</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                نوفر بيئة تدريب احترافية مجانية تجمع بين التعلم الجماعي والمشاريع العملية
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => (
                <Card key={idx} className="text-center border-2 hover:border-emerald-600/50 dark:hover:border-emerald-400/50 transition-all hover:shadow-lg group">
                  <CardContent className="pt-8 pb-6">
                    <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} text-white mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">كيف تبدأ رحلتك التعليمية؟</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                أربع خطوات بسيطة للانطلاق في تطوير مهاراتك المهنية مجاناً
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {steps.map((step, idx) => (
                <div key={idx} className="relative text-center group">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-red-600 text-white text-2xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <step.icon className="h-10 w-10" />
                  </div>
                  <div className="absolute top-10 right-0 w-full h-1 bg-gradient-to-l from-emerald-600 to-red-600 -z-10 hidden lg:block" style={{ width: idx < steps.length - 1 ? '100%' : '0' }} />
                  <div className="bg-card border-2 border-transparent hover:border-emerald-600/50 dark:hover:border-emerald-400/50 rounded-xl p-6 transition-all hover:shadow-lg">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold text-sm mb-3">
                      {step.number}
                    </div>
                    <h3 className="font-bold text-xl mb-3">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-emerald-600 via-emerald-700 to-red-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNk0xNCA0MGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTYiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">جاهز لتطوير مهاراتك؟</h2>
              <p className="text-xl opacity-90 leading-relaxed">
                انضم إلى مجتمع أكاديمية المهارات الجزائرية اليوم وابدأ رحلتك التعليمية المجانية مع فرق متميزة ومشاريع واقعية
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button size="lg" variant="secondary" className="gap-2 bg-white text-emerald-700 hover:bg-gray-100 shadow-xl" asChild>
                  <Link href="/register">
                    <Award className="h-5 w-5" />
                    سجل الآن مجاناً
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2 border-2 border-white text-white hover:bg-white/10" asChild>
                  <Link href="/login">
                    لديك حساب؟ ادخل هنا
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-red-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">أكاديمية المهارات الجزائرية</div>
                <div className="text-xs text-muted-foreground">منصة تدريب مجانية 100%</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              منصة تدريب جماعي مجانية لتطوير المهارات المهنية في البرمجة، التصميم، التسويق والتجارة الإلكترونية من خلال العمل على مشاريع حقيقية
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-6 border-t">
              <span>© 2024 أكاديمية المهارات الجزائرية</span>
              <span>•</span>
              <span>جميع الحقوق محفوظة</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

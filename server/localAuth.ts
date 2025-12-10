import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { User, UserRole } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "اسم المستخدم وكلمة المرور مطلوبان" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "اسم المستخدم مستخدم بالفعل" });
      }

      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        username,
        email: email || null,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        role: "member",
      });

      req.session.userId = user.id;

      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "فشل في إنشاء الحساب" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "اسم المستخدم وكلمة المرور مطلوبان" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "الحساب معطل" });
      }

      req.session.userId = user.id;

      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "فشل في تسجيل الدخول" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "فشل في تسجيل الخروج" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "غير مصرح" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "المستخدم غير موجود" });
      }

      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "فشل في جلب بيانات المستخدم" });
    }
  });

  app.patch("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { skills, bio, firstName, lastName } = req.body;
      const user = await storage.updateUserProfile(userId, { skills, bio, firstName, lastName });
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "فشل في تحديث الملف الشخصي" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "غير مصرح" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isActive) {
    req.session.destroy(() => {});
    return res.status(401).json({ message: "غير مصرح" });
  }

  next();
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "غير مصرح" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "غير مسموح: يتطلب صلاحيات المسؤول" });
  }

  next();
};

export const isRoomManager: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "غير مصرح" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user || (user.role !== "admin" && user.role !== "room_manager")) {
    return res.status(403).json({ message: "غير مسموح: يتطلب صلاحيات مدير الغرفة" });
  }

  next();
};

export async function seedDefaultUsers() {
  const defaultUsers = [
    {
      username: "admin",
      email: "admin@platform.com",
      password: "admin123",
      firstName: "مسؤول",
      lastName: "النظام",
      role: "admin" as UserRole,
      bio: "مسؤول النظام الرئيسي",
    },
    {
      username: "manager",
      email: "manager@platform.com",
      password: "manager123",
      firstName: "مدير",
      lastName: "الغرف",
      role: "room_manager" as UserRole,
      bio: "مدير الغرف التدريبية",
    },
    {
      username: "leader",
      email: "leader@platform.com",
      password: "leader123",
      firstName: "قائد",
      lastName: "الفريق",
      role: "team_leader" as UserRole,
      bio: "قائد فريق التطوير",
    },
    {
      username: "member",
      email: "member@platform.com",
      password: "member123",
      firstName: "عضو",
      lastName: "المنصة",
      role: "member" as UserRole,
      bio: "عضو جديد في المنصة",
    },
  ];

  console.log("Checking default users...");

  for (const userData of defaultUsers) {
    const existingUser = await storage.getUserByUsername(userData.username);
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      console.log(`Created default user: ${userData.username} (${userData.role})`);
    }
  }

  console.log("Default users check completed.");
}

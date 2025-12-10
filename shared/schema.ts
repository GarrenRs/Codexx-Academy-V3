import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User roles enum
export const userRoles = ["admin", "room_manager", "team_leader", "member"] as const;
export type UserRole = (typeof userRoles)[number];

// Users table with local auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email").unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").$type<UserRole>().default("member").notNull(),
  skills: text("skills").array(),
  bio: text("bio"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rooms table - represents specialization rooms
export const rooms = pgTable("rooms", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }).default("code"),
  managerId: varchar("manager_id").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Groups table - teams within rooms (max 4 members)
export const groups = pgTable("groups", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  leaderId: varchar("leader_id").references(() => users.id),
  maxMembers: integer("max_members").default(4).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Group members junction table
export const groupMembers = pgTable("group_members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  groupId: integer("group_id").references(() => groups.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Room members junction table
export const roomMembers = pgTable("room_members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Project status enum
export const projectStatuses = ["proposed", "voting", "approved", "in_progress", "completed", "rejected"] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

// Projects table
export const projects = pgTable("projects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  proposedById: varchar("proposed_by_id").references(() => users.id).notNull(),
  status: varchar("status").$type<ProjectStatus>().default("proposed").notNull(),
  approvedAt: timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project votes table
export const projectVotes = pgTable("project_votes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  voterId: varchar("voter_id").references(() => users.id).notNull(),
  vote: boolean("vote").notNull(), // true = approve, false = reject
  votedAt: timestamp("voted_at").defaultNow(),
});

// Task priority enum
export const taskPriorities = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof taskPriorities)[number];

// Task status enum
export const taskStatuses = ["todo", "in_progress", "review", "done"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

// Tasks table
export const tasks = pgTable("tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  assignedToGroupId: integer("assigned_to_group_id").references(() => groups.id),
  assignedToRoomId: integer("assigned_to_room_id").references(() => rooms.id),
  assignedToUserId: varchar("assigned_to_user_id").references(() => users.id),
  priority: varchar("priority").$type<TaskPriority>().default("medium").notNull(),
  status: varchar("status").$type<TaskStatus>().default("todo").notNull(),
  progress: integer("progress").default(0).notNull(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table for chat
export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  content: text("content").notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  roomId: integer("room_id").references(() => rooms.id),
  groupId: integer("group_id").references(() => groups.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Evaluations table for member performance
export const evaluations = pgTable("evaluations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  evaluateeId: varchar("evaluatee_id").references(() => users.id).notNull(),
  evaluatorId: varchar("evaluator_id").references(() => users.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  score: integer("score").notNull(), // 1-5
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  managedRooms: many(rooms),
  ledGroups: many(groups),
  groupMemberships: many(groupMembers),
  roomMemberships: many(roomMembers),
  proposedProjects: many(projects),
  votes: many(projectVotes),
  assignedTasks: many(tasks),
  sentMessages: many(messages),
  receivedEvaluations: many(evaluations, { relationName: "evaluatee" }),
  givenEvaluations: many(evaluations, { relationName: "evaluator" }),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  manager: one(users, {
    fields: [rooms.managerId],
    references: [users.id],
  }),
  groups: many(groups),
  members: many(roomMembers),
  tasks: many(tasks),
  messages: many(messages),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  room: one(rooms, {
    fields: [groups.roomId],
    references: [rooms.id],
  }),
  leader: one(users, {
    fields: [groups.leaderId],
    references: [users.id],
  }),
  members: many(groupMembers),
  tasks: many(tasks),
  messages: many(messages),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
  room: one(rooms, {
    fields: [roomMembers.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [roomMembers.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  proposedBy: one(users, {
    fields: [projects.proposedById],
    references: [users.id],
  }),
  votes: many(projectVotes),
  tasks: many(tasks),
  evaluations: many(evaluations),
}));

export const projectVotesRelations = relations(projectVotes, ({ one }) => ({
  project: one(projects, {
    fields: [projectVotes.projectId],
    references: [projects.id],
  }),
  voter: one(users, {
    fields: [projectVotes.voterId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignedToGroup: one(groups, {
    fields: [tasks.assignedToGroupId],
    references: [groups.id],
  }),
  assignedToRoom: one(rooms, {
    fields: [tasks.assignedToRoomId],
    references: [rooms.id],
  }),
  assignedToUser: one(users, {
    fields: [tasks.assignedToUserId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [messages.roomId],
    references: [rooms.id],
  }),
  group: one(groups, {
    fields: [messages.groupId],
    references: [groups.id],
  }),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  evaluatee: one(users, {
    fields: [evaluations.evaluateeId],
    references: [users.id],
    relationName: "evaluatee",
  }),
  evaluator: one(users, {
    fields: [evaluations.evaluatorId],
    references: [users.id],
    relationName: "evaluator",
  }),
  project: one(projects, {
    fields: [evaluations.projectId],
    references: [projects.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  completedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertEvaluationSchema = createInsertSchema(evaluations).omit({
  id: true,
  createdAt: true,
});

export const insertProjectVoteSchema = createInsertSchema(projectVotes).omit({
  id: true,
  votedAt: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertRoomMemberSchema = createInsertSchema(roomMembers).omit({
  id: true,
  joinedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Evaluation = typeof evaluations.$inferSelect;
export type InsertProjectVote = z.infer<typeof insertProjectVoteSchema>;
export type ProjectVote = typeof projectVotes.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type RoomMember = typeof roomMembers.$inferSelect;

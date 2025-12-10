import {
  users,
  rooms,
  groups,
  groupMembers,
  roomMembers,
  projects,
  projectVotes,
  tasks,
  messages,
  evaluations,
  type User,
  type UpsertUser,
  type Room,
  type InsertRoom,
  type Group,
  type InsertGroup,
  type Project,
  type InsertProject,
  type Task,
  type InsertTask,
  type Message,
  type InsertMessage,
  type Evaluation,
  type InsertEvaluation,
  type ProjectVote,
  type InsertProjectVote,
  type GroupMember,
  type RoomMember,
  type UserRole,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";

export type SafeUser = Omit<User, 'password'>;

export function omitPassword<T extends { password?: string }>(user: T): Omit<T, 'password'> {
  const { password, ...safeUser } = user;
  return safeUser;
}

export interface CreateUserData {
  username: string;
  email?: string | null;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: UserRole;
  bio?: string | null;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(data: CreateUserData): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: UserRole): Promise<User | undefined>;
  updateUserProfile(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<SafeUser[]>;
  
  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, data: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<void>;
  getRoomMembers(roomId: number): Promise<(RoomMember & { user: SafeUser })[]>;
  addRoomMember(roomId: number, userId: string): Promise<RoomMember>;
  removeRoomMember(roomId: number, userId: string): Promise<void>;
  isRoomMember(roomId: number, userId: string): Promise<boolean>;
  
  getGroups(): Promise<Group[]>;
  getGroupsByRoom(roomId: number): Promise<Group[]>;
  getGroup(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: number, data: Partial<InsertGroup>): Promise<Group | undefined>;
  deleteGroup(id: number): Promise<void>;
  getGroupMembers(groupId: number): Promise<(GroupMember & { user: SafeUser })[]>;
  addGroupMember(groupId: number, userId: string): Promise<GroupMember>;
  removeGroupMember(groupId: number, userId: string): Promise<void>;
  isGroupMember(groupId: number, userId: string): Promise<boolean>;
  getGroupMemberCount(groupId: number): Promise<number>;
  getUserGroups(userId: string): Promise<Group[]>;
  
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;
  getProjectVotes(projectId: number): Promise<ProjectVote[]>;
  addProjectVote(vote: InsertProjectVote): Promise<ProjectVote>;
  hasUserVoted(projectId: number, userId: string): Promise<boolean>;
  
  getTasks(): Promise<Task[]>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  getTasksByUser(userId: string): Promise<Task[]>;
  getTasksByGroup(groupId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;
  
  getMessages(roomId?: number, groupId?: number): Promise<(Message & { sender: SafeUser })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  getEvaluations(userId: string): Promise<Evaluation[]>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  
  getStats(): Promise<{
    totalUsers: number;
    totalRooms: number;
    totalGroups: number;
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(data: CreateUserData): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || "member",
        bio: data.bio,
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: UserRole): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserProfile(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<SafeUser[]> {
    const allUsers = await db.select().from(users);
    return allUsers.map(omitPassword);
  }

  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms).where(eq(rooms.isActive, true));
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    return newRoom;
  }

  async updateRoom(id: number, data: Partial<InsertRoom>): Promise<Room | undefined> {
    const [room] = await db
      .update(rooms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(rooms.id, id))
      .returning();
    return room;
  }

  async deleteRoom(id: number): Promise<void> {
    await db.update(rooms).set({ isActive: false }).where(eq(rooms.id, id));
  }

  async getRoomMembers(roomId: number): Promise<(RoomMember & { user: SafeUser })[]> {
    const members = await db
      .select()
      .from(roomMembers)
      .innerJoin(users, eq(roomMembers.userId, users.id))
      .where(eq(roomMembers.roomId, roomId));
    return members.map((m) => ({ ...m.room_members, user: omitPassword(m.users) }));
  }

  async addRoomMember(roomId: number, userId: string): Promise<RoomMember> {
    const [member] = await db
      .insert(roomMembers)
      .values({ roomId, userId })
      .returning();
    return member;
  }

  async removeRoomMember(roomId: number, userId: string): Promise<void> {
    await db
      .delete(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)));
  }

  async isRoomMember(roomId: number, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)));
    return !!member;
  }

  async getGroups(): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.isActive, true));
  }

  async getGroupsByRoom(roomId: number): Promise<Group[]> {
    return await db
      .select()
      .from(groups)
      .where(and(eq(groups.roomId, roomId), eq(groups.isActive, true)));
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    return newGroup;
  }

  async updateGroup(id: number, data: Partial<InsertGroup>): Promise<Group | undefined> {
    const [group] = await db
      .update(groups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return group;
  }

  async deleteGroup(id: number): Promise<void> {
    await db.update(groups).set({ isActive: false }).where(eq(groups.id, id));
  }

  async getGroupMembers(groupId: number): Promise<(GroupMember & { user: SafeUser })[]> {
    const members = await db
      .select()
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId));
    return members.map((m) => ({ ...m.group_members, user: omitPassword(m.users) }));
  }

  async addGroupMember(groupId: number, userId: string): Promise<GroupMember> {
    const [member] = await db
      .insert(groupMembers)
      .values({ groupId, userId })
      .returning();
    return member;
  }

  async removeGroupMember(groupId: number, userId: string): Promise<void> {
    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  }

  async isGroupMember(groupId: number, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    return !!member;
  }

  async getGroupMemberCount(groupId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
    return result?.count ?? 0;
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const memberships = await db
      .select()
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(and(eq(groupMembers.userId, userId), eq(groups.isActive, true)));
    return memberships.map((m) => m.groups);
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getProjectVotes(projectId: number): Promise<ProjectVote[]> {
    return await db
      .select()
      .from(projectVotes)
      .where(eq(projectVotes.projectId, projectId));
  }

  async addProjectVote(vote: InsertProjectVote): Promise<ProjectVote> {
    const [newVote] = await db.insert(projectVotes).values(vote).returning();
    return newVote;
  }

  async hasUserVoted(projectId: number, userId: string): Promise<boolean> {
    const [vote] = await db
      .select()
      .from(projectVotes)
      .where(and(eq(projectVotes.projectId, projectId), eq(projectVotes.voterId, userId)));
    return !!vote;
  }

  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedToUserId, userId));
  }

  async getTasksByGroup(groupId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedToGroupId, groupId));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.status === "done") {
      updateData.completedAt = new Date();
      updateData.progress = 100;
    }
    const [task] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getMessages(roomId?: number, groupId?: number): Promise<(Message & { sender: SafeUser })[]> {
    let query = db
      .select()
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id));

    if (roomId) {
      query = query.where(eq(messages.roomId, roomId)) as typeof query;
    } else if (groupId) {
      query = query.where(eq(messages.groupId, groupId)) as typeof query;
    }

    const result = await query.orderBy(desc(messages.createdAt)).limit(100);
    return result.map((r) => ({ ...r.messages, sender: omitPassword(r.users) }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getEvaluations(userId: string): Promise<Evaluation[]> {
    return await db
      .select()
      .from(evaluations)
      .where(eq(evaluations.evaluateeId, userId));
  }

  async createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
    const [newEvaluation] = await db
      .insert(evaluations)
      .values(evaluation)
      .returning();
    return newEvaluation;
  }

  async getStats(): Promise<{
    totalUsers: number;
    totalRooms: number;
    totalGroups: number;
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
  }> {
    const [usersCount] = await db.select({ count: count() }).from(users);
    const [roomsCount] = await db.select({ count: count() }).from(rooms).where(eq(rooms.isActive, true));
    const [groupsCount] = await db.select({ count: count() }).from(groups).where(eq(groups.isActive, true));
    const [projectsCount] = await db.select({ count: count() }).from(projects);
    const [tasksCount] = await db.select({ count: count() }).from(tasks);
    const [completedCount] = await db.select({ count: count() }).from(tasks).where(eq(tasks.status, "done"));

    return {
      totalUsers: usersCount?.count ?? 0,
      totalRooms: roomsCount?.count ?? 0,
      totalGroups: groupsCount?.count ?? 0,
      totalProjects: projectsCount?.count ?? 0,
      totalTasks: tasksCount?.count ?? 0,
      completedTasks: completedCount?.count ?? 0,
    };
  }
}

export const storage = new DatabaseStorage();

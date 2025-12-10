import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage, omitPassword } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, isRoomManager, seedDefaultUsers } from "./localAuth";
import {
  insertRoomSchema,
  insertGroupSchema,
  insertProjectSchema,
  insertTaskSchema,
  insertMessageSchema,
  insertEvaluationSchema,
} from "@shared/schema";
import crypto from "crypto";

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  verified: boolean;
  roomId?: number;
  groupId?: number;
}

const connectedClients: Map<WebSocket, ConnectedClient> = new Map();
const wsTokens: Map<string, { userId: string; expires: number }> = new Map();
const recentMessages: Map<string, Set<number>> = new Map(); // Deduplication: roomId/groupId -> message IDs
const messageQueue: Array<{ targetType: 'room' | 'group'; targetId: number; message: any }> = []; // Batch queue
let messageBatchTimer: NodeJS.Timeout | null = null;

function flushMessageQueue() {
  if (messageQueue.length === 0) return;
  
  const grouped = new Map<string, any[]>();
  for (const item of messageQueue) {
    const key = `${item.targetType}:${item.targetId}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item.message);
  }

  connectedClients.forEach((c) => {
    if (c.ws.readyState === WebSocket.OPEN && c.verified) {
      const roomKey = c.roomId ? `room:${c.roomId}` : null;
      const groupKey = c.groupId ? `group:${c.groupId}` : null;
      
      if (roomKey && grouped.has(roomKey)) {
        grouped.get(roomKey)!.forEach(msg => {
          c.ws.send(JSON.stringify({ type: 'new_message', message: msg }));
        });
      }
      if (groupKey && grouped.has(groupKey)) {
        grouped.get(groupKey)!.forEach(msg => {
          c.ws.send(JSON.stringify({ type: 'new_message', message: msg }));
        });
      }
    }
  });
  
  messageQueue.length = 0;
  messageBatchTimer = null;
}

function queueMessageBroadcast(targetType: 'room' | 'group', targetId: number, message: any) {
  messageQueue.push({ targetType, targetId, message });
  
  if (messageBatchTimer) clearTimeout(messageBatchTimer);
  messageBatchTimer = setTimeout(flushMessageQueue, 50); // Batch messages every 50ms
}

export function generateWsToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  wsTokens.set(token, { userId, expires: Date.now() + 60000 });
  return token;
}

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of wsTokens.entries()) {
    if (data.expires < now) {
      wsTokens.delete(token);
    }
  }
}

setInterval(cleanupExpiredTokens, 60000);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  await seedDefaultUsers();

  app.post('/api/ws-token', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const token = generateWsToken(userId);
      res.json({ token });
    } catch (error) {
      console.error("Error generating WS token:", error);
      res.status(500).json({ message: "Failed to generate token" });
    }
  });

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'auth') {
          const tokenData = wsTokens.get(message.token);
          if (!tokenData || tokenData.expires < Date.now()) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid or expired token' }));
            ws.close();
            return;
          }

          const user = await storage.getUser(tokenData.userId);
          if (!user) {
            ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
            ws.close();
            return;
          }

          wsTokens.delete(message.token);

          connectedClients.set(ws, {
            ws,
            userId: tokenData.userId,
            verified: true,
            roomId: undefined,
            groupId: undefined,
          });

          ws.send(JSON.stringify({ type: 'auth_success', userId: tokenData.userId }));
        } else if (message.type === 'join') {
          const client = connectedClients.get(ws);
          if (!client || !client.verified) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            return;
          }

          if (message.roomId) {
            const isMember = await storage.isRoomMember(message.roomId, client.userId);
            if (!isMember) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not a room member' }));
              return;
            }
            client.roomId = message.roomId;
            client.groupId = undefined;
          } else if (message.groupId) {
            const isMember = await storage.isGroupMember(message.groupId, client.userId);
            if (!isMember) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not a group member' }));
              return;
            }
            client.groupId = message.groupId;
            client.roomId = undefined;
          }

          ws.send(JSON.stringify({ type: 'join_success', roomId: client.roomId, groupId: client.groupId }));
        } else if (message.type === 'message') {
          const client = connectedClients.get(ws);
          if (!client || !client.verified) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            return;
          }

          if (message.roomId && message.groupId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Cannot specify both roomId and groupId' }));
            return;
          }

          let targetRoomId: number | null = null;
          let targetGroupId: number | null = null;

          if (message.roomId) {
            targetRoomId = message.roomId;
            const isMember = await storage.isRoomMember(targetRoomId!, client.userId);
            if (!isMember) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authorized to send messages to this room' }));
              return;
            }
          } else if (message.groupId) {
            targetGroupId = message.groupId;
            const isMember = await storage.isGroupMember(targetGroupId!, client.userId);
            if (!isMember) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authorized to send messages to this group' }));
              return;
            }
          } else if (client.roomId) {
            targetRoomId = client.roomId;
            const isMember = await storage.isRoomMember(targetRoomId, client.userId);
            if (!isMember) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authorized to send messages to this room' }));
              return;
            }
          } else if (client.groupId) {
            targetGroupId = client.groupId;
            const isMember = await storage.isGroupMember(targetGroupId, client.userId);
            if (!isMember) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authorized to send messages to this group' }));
              return;
            }
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'No target room or group specified' }));
            return;
          }

          const newMessage = await storage.createMessage({
            content: message.content,
            senderId: client.userId,
            roomId: targetRoomId,
            groupId: targetGroupId,
          });

          const user = await storage.getUser(client.userId);
          const messageWithSender = { ...newMessage, sender: user ? omitPassword(user) : null };

          // Deduplication: Track message IDs to avoid duplicates
          const targetKey = targetRoomId ? `room:${targetRoomId}` : `group:${targetGroupId}`;
          if (!recentMessages.has(targetKey)) {
            recentMessages.set(targetKey, new Set());
          }
          recentMessages.get(targetKey)!.add(newMessage.id);
          
          // Limit recent messages tracking to 500 per room/group
          if (recentMessages.get(targetKey)!.size > 500) {
            const messages = Array.from(recentMessages.get(targetKey)!);
            messages.slice(0, -500).forEach(id => recentMessages.get(targetKey)!.delete(id));
          }

          // Queue message broadcast instead of immediate send (batching)
          if (targetRoomId) {
            queueMessageBroadcast('room', targetRoomId, messageWithSender);
          } else if (targetGroupId) {
            queueMessageBroadcast('group', targetGroupId, messageWithSender);
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Internal server error' }));
      }
    });

    ws.on('close', () => {
      connectedClients.delete(ws);
    });
  });

  // Rooms routes
  app.get('/api/rooms', isAuthenticated, async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.get('/api/rooms/:id', isAuthenticated, async (req, res) => {
    try {
      const room = await storage.getRoom(parseInt(req.params.id));
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  app.post('/api/rooms', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertRoomSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid room data", errors: parsed.error.errors });
      }
      const room = await storage.createRoom(parsed.data);
      res.status(201).json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.patch('/api/rooms/:id', isAuthenticated, isRoomManager, async (req, res) => {
    try {
      const room = await storage.updateRoom(parseInt(req.params.id), req.body);
      res.json(room);
    } catch (error) {
      console.error("Error updating room:", error);
      res.status(500).json({ message: "Failed to update room" });
    }
  });

  app.delete('/api/rooms/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteRoom(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting room:", error);
      res.status(500).json({ message: "Failed to delete room" });
    }
  });

  app.get('/api/rooms/:id/members', isAuthenticated, async (req, res) => {
    try {
      const members = await storage.getRoomMembers(parseInt(req.params.id));
      res.json(members);
    } catch (error) {
      console.error("Error fetching room members:", error);
      res.status(500).json({ message: "Failed to fetch room members" });
    }
  });

  app.post('/api/rooms/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const userId = req.session.userId;

      const isMember = await storage.isRoomMember(roomId, userId);
      if (isMember) {
        return res.status(400).json({ message: "أنت عضو بالفعل في هذه الغرفة" });
      }

      const member = await storage.addRoomMember(roomId, userId);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ message: "فشل في الانضمام للغرفة" });
    }
  });

  app.post('/api/rooms/:id/leave', isAuthenticated, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const userId = req.session.userId;
      await storage.removeRoomMember(roomId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error leaving room:", error);
      res.status(500).json({ message: "Failed to leave room" });
    }
  });

  // Groups routes
  app.get('/api/groups', isAuthenticated, async (req, res) => {
    try {
      const roomId = req.query.roomId ? parseInt(req.query.roomId as string) : undefined;
      const groups = roomId
        ? await storage.getGroupsByRoom(roomId)
        : await storage.getGroups();
      
      // Enrich with members and room data
      const enrichedGroups = await Promise.all(
        groups.map(async (group) => {
          const members = await storage.getGroupMembers(group.id);
          const leaderData = group.leaderId ? await storage.getUser(group.leaderId) : null;
          const room = await storage.getRoom(group.roomId);
          return {
            ...group,
            members: members.map(m => ({ user: m.user })),
            leader: leaderData ? omitPassword(leaderData) : null,
            room: room ? { name: room.name } : null,
            _count: { members: members.length }
          };
        })
      );
      
      res.json(enrichedGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get('/api/groups/:id', isAuthenticated, async (req, res) => {
    try {
      const group = await storage.getGroup(parseInt(req.params.id));
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      // Fetch additional data for group detail
      const members = await storage.getGroupMembers(group.id);
      const leaderData = group.leaderId ? await storage.getUser(group.leaderId) : null;
      const room = await storage.getRoom(group.roomId);

      res.json({
        ...group,
        members: members.map(m => ({ user: m.user })),
        leader: leaderData ? omitPassword(leaderData) : null,
        room: room ? { name: room.name } : null,
        _count: { members: members.length }
      });
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  app.post('/api/groups', isAuthenticated, isRoomManager, async (req, res) => {
    try {
      const parsed = insertGroupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid group data", errors: parsed.error.errors });
      }
      const group = await storage.createGroup(parsed.data);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.get('/api/groups/:id/members', isAuthenticated, async (req, res) => {
    try {
      const members = await storage.getGroupMembers(parseInt(req.params.id));
      res.json(members);
    } catch (error) {
      console.error("Error fetching group members:", error);
      res.status(500).json({ message: "Failed to fetch group members" });
    }
  });

  app.get('/api/groups/:id/activities', isAuthenticated, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      // Fetch group activities: creation, members, and messages
      const activities: any[] = [];

      // Group created event
      activities.push({
        id: `group_created_${group.id}`,
        type: "group_created",
        description: `تم إنشاء المجموعة "${group.name}"`,
        timestamp: group.createdAt,
        actor: group.leaderId,
      });

      // Get group members with join info
      const members = await storage.getGroupMembers(groupId);
      members.forEach((member) => {
        activities.push({
          id: `member_${member.user.id}`,
          type: "member_joined",
          description: `انضم ${member.user.firstName} ${member.user.lastName} للمجموعة`,
          timestamp: member.joinedAt || group.createdAt,
          user: member.user,
        });
      });

      // Get group messages
      const messages = await storage.getMessages(undefined, groupId);
      const recentMessages = messages.slice(-20); // Last 20 messages
      recentMessages.forEach((msg) => {
        activities.push({
          id: `message_${msg.id}`,
          type: "message_posted",
          description: `أرسل ${msg.sender?.firstName || "مستخدم"} رسالة`,
          timestamp: msg.createdAt,
          user: msg.sender,
          metadata: { content: msg.content },
        });
      });

      // Sort by timestamp descending
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json(activities);
    } catch (error) {
      console.error("Error fetching group activities:", error);
      res.status(500).json({ message: "Failed to fetch group activities" });
    }
  });

  app.post('/api/groups/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const userId = req.session.userId;

      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "المجموعة غير موجودة" });
      }

      const memberCount = await storage.getGroupMemberCount(groupId);
      if (memberCount >= group.maxMembers) {
        return res.status(400).json({ message: "المجموعة ممتلئة ولا تقبل أعضاء جدد" });
      }

      const isMember = await storage.isGroupMember(groupId, userId);
      if (isMember) {
        return res.status(400).json({ message: "أنت عضو بالفعل في هذه المجموعة" });
      }

      const member = await storage.addGroupMember(groupId, userId);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error joining group:", error);
      res.status(500).json({ message: "فشل في الانضمام للمجموعة" });
    }
  });

  app.post('/api/groups/:id/leave', isAuthenticated, async (req: any, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const userId = req.session.userId;
      await storage.removeGroupMember(groupId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error leaving group:", error);
      res.status(500).json({ message: "Failed to leave group" });
    }
  });

  app.get('/api/user/groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const groups = await storage.getUserGroups(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ message: "Failed to fetch user groups" });
    }
  });

  // Projects routes
  const validProjectStatuses = ['pending', 'voting', 'approved', 'rejected', 'in_progress', 'completed'];

  app.get('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const { status, limit } = req.query;
      let projects = await storage.getProjects();

      if (status && typeof status === 'string') {
        if (!validProjectStatuses.includes(status)) {
          return res.status(400).json({ message: `Invalid status. Valid statuses: ${validProjectStatuses.join(', ')}` });
        }
        projects = projects.filter(p => p.status === status);
      }

      if (limit && typeof limit === 'string') {
        const limitNum = parseInt(limit);
        if (!isNaN(limitNum) && limitNum > 0) {
          projects = projects.slice(0, limitNum);
        }
      }

      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Fetch additional data
      const proposedBy = project.proposedById ? await storage.getUser(project.proposedById) : null;
      const votes = await storage.getProjectVotes(projectId);
      const tasks = await storage.getTasksByProject(projectId);
      const userId = req.session.userId;
      const userVote = votes.find((v) => v.voterId === userId);

      // Calculate approval rate
      const approvalCount = votes.filter((v) => v.vote === true).length;
      const totalVotes = votes.length;
      const approvalRate = totalVotes > 0 ? (approvalCount / totalVotes) * 100 : 0;

      res.json({
        ...project,
        proposedBy: proposedBy ? omitPassword(proposedBy) : null,
        votes,
        _count: { votes: totalVotes, tasks: tasks.length },
        approvalRate,
        userVote,
      });
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const parsed = insertProjectSchema.safeParse({
        ...req.body,
        proposedById: userId,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid project data", errors: parsed.error.errors });
      }
      const project = await storage.createProject(parsed.data);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const updateData = { ...req.body };
      
      // تحويل approvedAt إلى Date object إذا كان string
      if (updateData.approvedAt && typeof updateData.approvedAt === 'string') {
        updateData.approvedAt = new Date(updateData.approvedAt);
      }
      
      // تحويل completedAt إلى Date object إذا كان string
      if (updateData.completedAt && typeof updateData.completedAt === 'string') {
        updateData.completedAt = new Date(updateData.completedAt);
      }
      
      const project = await storage.updateProject(parseInt(req.params.id), updateData);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.get('/api/projects/:id/votes', isAuthenticated, async (req, res) => {
    try {
      const votes = await storage.getProjectVotes(parseInt(req.params.id));
      res.json(votes);
    } catch (error) {
      console.error("Error fetching project votes:", error);
      res.status(500).json({ message: "Failed to fetch project votes" });
    }
  });

  app.post('/api/projects/:id/vote', isAuthenticated, isRoomManager, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { vote } = req.body;

      const hasVoted = await storage.hasUserVoted(projectId, userId);
      if (hasVoted) {
        return res.status(400).json({ message: "Already voted on this project" });
      }

      const newVote = await storage.addProjectVote({
        projectId,
        voterId: userId,
        vote,
      });
      res.status(201).json(newVote);
    } catch (error) {
      console.error("Error voting on project:", error);
      res.status(500).json({ message: "Failed to vote on project" });
    }
  });

  // Tasks routes
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId, groupId, userId: queryUserId } = req.query;
      let tasks;

      if (projectId) {
        tasks = await storage.getTasksByProject(parseInt(projectId as string));
      } else if (groupId) {
        tasks = await storage.getTasksByGroup(parseInt(groupId as string));
      } else if (queryUserId) {
        tasks = await storage.getTasksByUser(queryUserId as string);
      } else {
        const userId = req.session.userId;
        tasks = await storage.getTasksByUser(userId);
      }

      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const task = await storage.getTask(parseInt(req.params.id));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req, res) => {
    try {
      const parsed = insertTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid task data", errors: parsed.error.errors });
      }
      const task = await storage.createTask(parsed.data);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const task = await storage.updateTask(parseInt(req.params.id), req.body);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTask(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Messages routes
  app.get('/api/messages', isAuthenticated, async (req, res) => {
    try {
      const { roomId, groupId } = req.query;
      const messages = await storage.getMessages(
        roomId ? parseInt(roomId as string) : undefined,
        groupId ? parseInt(groupId as string) : undefined
      );
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const parsed = insertMessageSchema.safeParse({
        ...req.body,
        senderId: userId,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid message data", errors: parsed.error.errors });
      }
      const message = await storage.createMessage(parsed.data);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Evaluations routes
  app.get('/api/evaluations/:userId', isAuthenticated, async (req, res) => {
    try {
      const evaluations = await storage.getEvaluations(req.params.userId);
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      res.status(500).json({ message: "Failed to fetch evaluations" });
    }
  });

  app.post('/api/evaluations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const parsed = insertEvaluationSchema.safeParse({
        ...req.body,
        evaluatorId: userId,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid evaluation data", errors: parsed.error.errors });
      }
      const evaluation = await storage.createEvaluation(parsed.data);
      res.status(201).json(evaluation);
    } catch (error) {
      console.error("Error creating evaluation:", error);
      res.status(500).json({ message: "Failed to create evaluation" });
    }
  });

  // Stats routes
  app.get('/api/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:id/role', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Error:', err);
    res.status(status).json({ message });
  });

  return httpServer;
}
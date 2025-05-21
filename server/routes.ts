import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";

// JWT Secret key (should be in .env in production)
const JWT_SECRET = process.env.JWT_SECRET || "farm_management_secret_key";

// Interface for JWT token payload
interface TokenPayload {
  id: string;
  name: string;
  role: string;
  section: string;
}

// Authentication middleware
const authenticate = (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    // Add user data to request
    (req as any).user = decoded;

    // Check if user is a boss
    if (decoded.role !== "boss") {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Add CORS headers to all responses
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });

  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      console.log('Received message:', message);
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // Broadcast function for WebSocket notifications
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };
  
  // Login endpoint - first step of two-step authentication
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      console.log("Server received SMS code request for phone:", phoneNumber);
      
      if (!phoneNumber) {
        console.log("Missing phone number");
        return res.status(400).json({ 
          success: false, 
          message: "Phone number is required" 
        });
      }
      
      // Valid phone numbers for testing
      const validPhones = ["+998901234567", "+1234567890"];
      
      if (!validPhones.includes(phoneNumber)) {
        console.log("Invalid phone number:", phoneNumber);
        return res.status(404).json({ 
          success: false, 
          message: "Phone number not registered in the system" 
        });
      }
      
      // In a real application, this would send an SMS via a service like Twilio
      // For this demo, we'll just return a successful response
      console.log("SMS code sent (simulated) to:", phoneNumber);
      
      return res.json({
        success: true,
        message: "Verification code sent to " + phoneNumber
      });
      
    } catch (error) {
      console.error('SMS code request error:', error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
  
  // Verify SMS code - second step of two-step authentication
  app.post('/api/auth/verify', async (req, res) => {
    try {
      const { phoneNumber, code } = req.body;
      
      console.log("Server received verification request:", { phoneNumber, code });
      
      if (!phoneNumber || !code) {
        console.log("Missing phone number or code");
        return res.status(400).json({ 
          success: false, 
          message: "Phone number and verification code are required" 
        });
      }
      
      // Valid phone numbers for testing
      const validPhones = ["+998901234567", "+1234567890"];
      
      if (!validPhones.includes(phoneNumber)) {
        console.log("Invalid phone number:", phoneNumber);
        return res.status(404).json({ 
          success: false, 
          message: "Phone number not registered in the system" 
        });
      }
      
      // In a real application, this would verify the code against what was sent
      // For this demo, we'll accept a hardcoded code
      if (code !== "123456") {
        console.log("Invalid verification code:", code);
        return res.status(400).json({ 
          success: false, 
          message: "Invalid verification code" 
        });
      }
      
      // User data based on phone number
      const user = phoneNumber === "+998901234567" ? {
        id: "user-1",
        name: "Alisher Zokirov",
        phoneNumber: phoneNumber,
        role: "boss",
        section: {
          id: "section-1",
          name: "Tovuq parvarish bo'limi"
        },
        position: {
          id: "position-1",
          name: "Bo'lim boshlig'i"
        }
      } : {
        id: "user-2",
        name: "Akmal Tohirov",
        phoneNumber: phoneNumber,
        role: "boss",
        section: {
          id: "section-2",
          name: "Tovuq so'yish bo'limi"
        },
        position: {
          id: "position-1",
          name: "Bo'lim boshlig'i"
        }
      };
      
      // Create JWT token
      const token = jwt.sign({
        id: user.id,
        name: user.name,
        role: user.role,
        section: user.section.id
      }, JWT_SECRET, { expiresIn: '24h' });
      
      console.log("Verification successful, returning token and user data");
      
      // Return in the format specified by the API documentation
      return res.json({
        success: true,
        message: "Login successful",
        data: {
          user,
          token
        }
      });
      
    } catch (error) {
      console.error('Verification error:', error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // User endpoints
  app.get('/api/users', authenticate, async (req, res) => {
    try {
      const { role, section, limit = 10, page = 1 } = req.query;
      
      // Mock users response
      const users = [
        {
          id: "60d21b4667d0d8992e610c85",
          name: "Alisher Zokirov",
          phoneNumber: "+998901234567",
          role: "boss",
          section: {
            id: "60d21b4667d0d8992e610c87",
            name: "Tovuq parvarish bo'limi"
          },
          position: {
            id: "60d21b4667d0d8992e610c90",
            name: "Bo'lim boshlig'i"
          },
          createdAt: "2023-06-19T12:00:00.000Z",
          updatedAt: "2023-06-19T12:00:00.000Z"
        }
      ];
      
      return res.json({
        success: true,
        total: 45,
        page: Number(page),
        limit: Number(limit),
        users
      });
      
    } catch (error) {
      console.error('Get users error:', error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
  
  app.post('/api/users', authenticate, async (req, res) => {
    try {
      const { name, phoneNumber, role, section, position } = req.body;
      
      // Mock user creation response
      const user = {
        id: "60d21b4667d0d8992e610c86",
        name,
        phoneNumber,
        role,
        section,
        position,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return res.status(201).json({
        success: true,
        user
      });
      
    } catch (error) {
      console.error('Create user error:', error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
  
  app.put('/api/users/:id', authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, phoneNumber, role, section, position } = req.body;
      
      // Mock user update response
      const user = {
        id,
        name,
        phoneNumber,
        role,
        section,
        position,
        createdAt: "2023-06-19T12:00:00.000Z",
        updatedAt: new Date().toISOString()
      };
      
      return res.json({
        success: true,
        user
      });
      
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
  
  // Attendance endpoints
  app.post('/api/attendance/tasks', authenticate, async (req, res) => {
    try {
      const { assignedTo, section, date, notes } = req.body;
      
      // Mock attendance task creation response
      const task = {
        id: "60d21b4667d0d8992e610c92",
        assignedTo,
        section,
        date,
        notes,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return res.status(201).json({
        success: true,
        task
      });
      
    } catch (error) {
      console.error('Create attendance task error:', error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
  
  app.get('/api/attendance/stats', authenticate, async (req, res) => {
    try {
      const { startDate, endDate, section } = req.query;
      
      // Mock attendance stats response
      const stats = {
        totalEmployees: 42,
        averageAttendance: 85,
        byDate: [
          {
            date: "2025-05-01T00:00:00.000Z",
            present: 38,
            absent: 4,
            late: 0,
            percentage: 90
          },
          {
            date: "2025-05-02T00:00:00.000Z",
            present: 36,
            absent: 4,
            late: 2,
            percentage: 86
          }
        ]
      };
      
      return res.json({
        success: true,
        stats
      });
      
    } catch (error) {
      console.error('Get attendance stats error:', error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
  
  // Position endpoints
  app.post('/api/positions', authenticate, async (req, res) => {
    try {
      const { name, description, responsibilities, permissions, baseSalary } = req.body;
      
      // Mock position creation response
      const position = {
        id: "60d21b4667d0d8992e610c93",
        name,
        description,
        responsibilities,
        permissions,
        baseSalary,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return res.status(201).json({
        success: true,
        position
      });
      
    } catch (error) {
      console.error('Create position error:', error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
  
  // Batch endpoints
  app.post('/api/batches', authenticate, async (req, res) => {
    try {
      const { 
        batchNumber, section, period, arrivalDate, initialCount, 
        breed, supplier, notes, acceptableMortalityRate, 
        acceptableGrowthVariance, notificationPhoneNumbers 
      } = req.body;
      
      // Mock batch creation response
      const batch = {
        id: "60d21b4667d0d8992e610c94",
        batchNumber,
        section,
        period,
        arrivalDate,
        initialCount,
        currentCount: initialCount,
        breed,
        supplier,
        notes,
        acceptableMortalityRate,
        acceptableGrowthVariance,
        notificationPhoneNumbers,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return res.status(201).json({
        success: true,
        batch
      });
      
    } catch (error) {
      console.error('Create batch error:', error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
  
  // Slaughter batch endpoints
  app.post('/api/slaughter/batches', authenticate, async (req, res) => {
    try {
      const { 
        batchNumber, chickenBatch, section, plannedDate, 
        preslaughterCount, preslaughterAverageWeight, 
        processingTeam, notes 
      } = req.body;
      
      // Mock slaughter batch creation response
      const slaughterBatch = {
        id: "60d21b4667d0d8992e610c95",
        batchNumber,
        chickenBatch,
        section,
        plannedDate,
        actualDate: null,
        preslaughterCount,
        preslaughterAverageWeight,
        postslaughterCount: null,
        postslaughterAverageWeight: null,
        processingTeam,
        notes,
        status: "planned",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return res.status(201).json({
        success: true,
        slaughterBatch
      });
      
    } catch (error) {
      console.error('Create slaughter batch error:', error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
  
  // Report endpoints
  app.post('/api/reports/section/:sectionId', authenticate, async (req, res) => {
    try {
      const { sectionId } = req.params;
      const { startDate, endDate, includeProduction, includeInventory, includeAttendance } = req.body;
      
      // Mock report response
      const report = {
        sectionId,
        period: {
          startDate,
          endDate
        },
        summary: {
          totalBatches: 3,
          totalChickens: 2950,
          averageWeight: 2.85,
          mortalityRate: 1.8,
          inventoryUsage: 12500,
          attendanceRate: 87
        },
        production: includeProduction ? {
          batches: [
            {
              id: "60d21b4667d0d8992e610c94",
              batchNumber: "B-2025-001",
              initialCount: 1000,
              currentCount: 980,
              averageWeight: 2.8,
              growthRate: 0.35,
              mortalityRate: 2.0
            }
          ]
        } : null,
        inventory: includeInventory ? {
          usage: [
            {
              category: "Feed",
              quantity: 8500,
              cost: 42500000
            },
            {
              category: "Medicine",
              quantity: 150,
              cost: 7500000
            }
          ]
        } : null,
        attendance: includeAttendance ? {
          average: 87,
          byDate: [
            {
              date: "2025-05-01T00:00:00.000Z",
              rate: 90
            },
            {
              date: "2025-05-02T00:00:00.000Z",
              rate: 86
            }
          ]
        } : null
      };
      
      return res.json({
        success: true,
        report
      });
      
    } catch (error) {
      console.error('Get report error:', error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
  
  // Canteen endpoints
  app.post('/api/canteen/daily-menus', authenticate, async (req, res) => {
    try {
      const { date, items, notes } = req.body;
      
      // Mock daily menu creation response
      const dailyMenu = {
        id: "60d21b4667d0d8992e610c96",
        date,
        items,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return res.status(201).json({
        success: true,
        dailyMenu
      });
      
    } catch (error) {
      console.error('Create daily menu error:', error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
  
  // Inventory endpoints
  app.post('/api/inventory/transactions', authenticate, async (req, res) => {
    try {
      const { itemId, type, quantity, date, batchId, price, supplier, notes } = req.body;
      
      // Mock inventory transaction creation response
      const transaction = {
        id: "60d21b4667d0d8992e610c97",
        itemId,
        type,
        quantity,
        date,
        batchId,
        price,
        supplier,
        notes,
        createdAt: new Date().toISOString()
      };
      
      return res.status(201).json({
        success: true,
        transaction
      });
      
    } catch (error) {
      console.error('Create inventory transaction error:', error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
  
  return httpServer;
}

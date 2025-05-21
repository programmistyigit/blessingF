import { pgTable, text, serial, integer, boolean, timestamp, real, date, varchar, numeric, jsonb, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users & Authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("worker"),
  sectionId: text("section_id").notNull(),
  positionId: text("position_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  responsibilities: text("responsibilities").array(),
  permissions: text("permissions").array(),
  baseSalary: integer("base_salary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Attendance Management
export const attendanceTasks = pgTable("attendance_tasks", {
  id: serial("id").primaryKey(),
  assignedTo: text("assigned_to").notNull(),
  section: text("section").notNull(),
  date: timestamp("date").notNull(),
  notes: text("notes"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Task Management for Boss
export const managementTasks = pgTable("management_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  createdBy: text("created_by").notNull(), // boss ID
  assignedTo: text("assigned_to").array(), // worker IDs
  supervisors: text("supervisors").array(), // manager/supervisor IDs
  priority: text("priority").notNull(), // 'low', 'medium', 'high', 'urgent'
  status: text("status").notNull(), // 'assigned', 'in_progress', 'completed', 'cancelled'
  dueDate: timestamp("due_date"),
  startDate: timestamp("start_date"),
  completedDate: timestamp("completed_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  date: date("date").notNull(),
  status: text("status").notNull(), // present, absent, late
  recordedBy: text("recorded_by").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Chicken Batch Management
export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  batchNumber: text("batch_number").notNull().unique(),
  section: text("section").notNull(),
  period: text("period").notNull(),
  arrivalDate: timestamp("arrival_date").notNull(),
  initialCount: integer("initial_count").notNull(),
  currentCount: integer("current_count").notNull(),
  breed: text("breed").notNull(),
  supplier: text("supplier").notNull(),
  notes: text("notes"),
  acceptableMortalityRate: real("acceptable_mortality_rate"),
  acceptableGrowthVariance: real("acceptable_growth_variance"),
  notificationPhoneNumbers: text("notification_phone_numbers").array(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Slaughter Management
export const slaughterBatches = pgTable("slaughter_batches", {
  id: serial("id").primaryKey(),
  batchNumber: text("batch_number").notNull().unique(),
  chickenBatch: text("chicken_batch").notNull(),
  section: text("section").notNull(),
  plannedDate: timestamp("planned_date").notNull(),
  actualDate: timestamp("actual_date"),
  preslaughterCount: integer("preslaughter_count").notNull(),
  preslaughterAverageWeight: real("preslaughter_average_weight").notNull(),
  postslaughterCount: integer("postslaughter_count"),
  postslaughterAverageWeight: real("postslaughter_average_weight"),
  processingTeam: text("processing_team").array(),
  notes: text("notes"),
  status: text("status").notNull().default("planned"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Inventory Management
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  currentQuantity: real("current_quantity").notNull().default(0),
  minimumQuantity: real("minimum_quantity").notNull().default(0),
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  location: text("location").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  itemId: text("item_id").notNull(),
  type: text("type").notNull(), // addition, deduction
  quantity: real("quantity").notNull(),
  date: timestamp("date").notNull(),
  batchId: text("batch_id"),
  price: real("price"),
  supplier: text("supplier"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Canteen Management
export const dishIngredients = pgTable("dish_ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  costPerUnit: real("cost_per_unit"),
  inStock: real("in_stock").notNull().default(0),
  minimumStock: real("minimum_stock").notNull().default(0),
  description: text("description"),
  supplier: text("supplier"),
  allergens: text("allergens").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dishes = pgTable("dishes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // breakfast, lunch, dinner, dessert, drink
  type: text("type").notNull(), // main, soup, salad, dessert, drink
  defaultQuantity: real("default_quantity").notNull(),
  unit: text("unit").notNull(),
  nutritionalInfo: jsonb("nutritional_info"), // calories, protein, fat, carbs, etc
  ingredients: jsonb("ingredients"), // array of ingredient IDs and quantities
  preparationSteps: text("preparation_steps").array(),
  cost: real("cost"),
  preparationTime: integer("preparation_time"), // in minutes
  cookingTemperature: text("cooking_temperature"),
  servingInstructions: text("serving_instructions"),
  storageInstructions: text("storage_instructions"),
  allergens: text("allergens").array(),
  isActive: boolean("is_active").notNull().default(true),
  image: text("image"),
  popularity: jsonb("popularity"), // rating, voteCount, lastServed, servedCount
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const menus = pgTable("menus", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // daily, weekly, special
  status: text("status").notNull().default("draft"), // draft, active, inactive
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  mealTypes: text("meal_types").array(), // breakfast, lunch, dinner
  days: jsonb("days"), // array of days with meals and dishes
  nutritionalInfo: jsonb("nutritional_info"), // average nutritional values
  costInfo: jsonb("cost_info"), // cost calculations
  statusHistory: jsonb("status_history"), // history of status changes
  createdBy: integer("created_by"),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dailyMenus = pgTable("daily_menus", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  menuId: integer("menu_id"),
  meals: jsonb("meals"), // detailed meals for the day
  totalCalories: integer("total_calories"),
  totalCost: real("total_cost"),
  notes: text("notes"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const mealSessions = pgTable("meal_sessions", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  type: text("type").notNull(), // breakfast, lunch, dinner
  timeFrom: time("time_from").notNull(),
  timeTo: time("time_to").notNull(),
  menuId: integer("menu_id"),
  dailyMenuId: integer("daily_menu_id"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  employeeCount: integer("employee_count"),
  actualCost: real("actual_cost"),
  supervisor: integer("supervisor"), // user ID of supervisor
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const canteenVotings = pgTable("canteen_votings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  dishOptions: jsonb("dish_options"), // array of dish IDs to vote for
  maxVotesPerUser: integer("max_votes_per_user").notNull().default(1),
  votes: jsonb("votes"), // array of {userId, dishId, timestamp}
  isActive: boolean("is_active").notNull().default(true),
  results: jsonb("results"), // calculated results after voting ends
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Finance & Expenses Management
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // feed, medicine, labor, utilities, maintenance, equipment, transportation, administrative, marketing, taxes, other
  subcategory: text("subcategory"),
  amount: numeric("amount").notNull(),
  date: timestamp("date").notNull(),
  sectionId: integer("section_id"),
  batchId: integer("batch_id"),
  supplier: text("supplier"),
  paymentMethod: text("payment_method"), // cash, bank_transfer, credit_card, other
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, partially_paid, cancelled
  paymentDate: timestamp("payment_date"),
  documentNumber: text("document_number"),
  documentImage: text("document_image"),
  items: jsonb("items"), // detailed list of items included in the expense
  approvalStatus: text("approval_status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: integer("approved_by"),
  approvalDate: timestamp("approval_date"),
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  status: text("status").notNull().default("draft"), // draft, active, completed
  currency: text("currency").notNull().default("UZS"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  categories: jsonb("categories"), // detailed budget categories
  revenue: jsonb("revenue"), // revenue sources and amounts
  notes: text("notes"),
  approvalHistory: jsonb("approval_history"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const budgetAttachments = pgTable("budget_attachments", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const revenues = pgTable("revenues", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  source: text("source").notNull(), // meat_sales, by_product_sales, other
  amount: numeric("amount").notNull(),
  date: timestamp("date").notNull(),
  customer: text("customer"),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, received, partially_received, cancelled
  invoiceNumber: text("invoice_number"),
  invoiceImage: text("invoice_image"),
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schema for inserts
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSectionSchema = createInsertSchema(sections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttendanceTaskSchema = createInsertSchema(attendanceTasks).omit({
  id: true,
  completed: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
});

export const insertBatchSchema = createInsertSchema(batches).omit({
  id: true,
  currentCount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSlaughterBatchSchema = createInsertSchema(slaughterBatches).omit({
  id: true,
  actualDate: true,
  postslaughterCount: true,
  postslaughterAverageWeight: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions).omit({
  id: true,
  createdAt: true,
});

// Eski menuItems jadvalini olib tashladik

export const insertDishIngredientSchema = createInsertSchema(dishIngredients).omit({
  id: true, 
  createdAt: true,
  updatedAt: true,
});

export const insertDishSchema = createInsertSchema(dishes).omit({
  id: true,
  isActive: true,
  popularity: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMenuSchema = createInsertSchema(menus).omit({
  id: true,
  status: true,
  statusHistory: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyMenuSchema = createInsertSchema(dailyMenus).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMealSessionSchema = createInsertSchema(mealSessions).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCanteenVotingSchema = createInsertSchema(canteenVotings).omit({
  id: true,
  votes: true,
  results: true,
  createdAt: true,
  updatedAt: true,
});

export const insertManagementTaskSchema = createInsertSchema(managementTasks).omit({
  id: true,
  status: true,
  completedDate: true,
  startDate: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  approvalStatus: true,
  approvedBy: true,
  approvalDate: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBudgetAttachmentSchema = createInsertSchema(budgetAttachments).omit({
  id: true,
  uploadedAt: true,
});

export const insertRevenueSchema = createInsertSchema(revenues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type Section = typeof sections.$inferSelect;
export type InsertSection = z.infer<typeof insertSectionSchema>;

export type AttendanceTask = typeof attendanceTasks.$inferSelect;
export type InsertAttendanceTask = z.infer<typeof insertAttendanceTaskSchema>;

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;

export type Batch = typeof batches.$inferSelect;
export type InsertBatch = z.infer<typeof insertBatchSchema>;

export type SlaughterBatch = typeof slaughterBatches.$inferSelect;
export type InsertSlaughterBatch = z.infer<typeof insertSlaughterBatchSchema>;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;

export type DishIngredient = typeof dishIngredients.$inferSelect;
export type InsertDishIngredient = z.infer<typeof insertDishIngredientSchema>;

export type Dish = typeof dishes.$inferSelect;
export type InsertDish = z.infer<typeof insertDishSchema>;

export type Menu = typeof menus.$inferSelect;
export type InsertMenu = z.infer<typeof insertMenuSchema>;

export type MealSession = typeof mealSessions.$inferSelect;
export type InsertMealSession = z.infer<typeof insertMealSessionSchema>;

export type CanteenVoting = typeof canteenVotings.$inferSelect;
export type InsertCanteenVoting = z.infer<typeof insertCanteenVotingSchema>;

export type DailyMenu = typeof dailyMenus.$inferSelect;
export type InsertDailyMenu = z.infer<typeof insertDailyMenuSchema>;

export type ManagementTask = typeof managementTasks.$inferSelect;
export type InsertManagementTask = z.infer<typeof insertManagementTaskSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type BudgetAttachment = typeof budgetAttachments.$inferSelect;
export type InsertBudgetAttachment = z.infer<typeof insertBudgetAttachmentSchema>;

export type Revenue = typeof revenues.$inferSelect;
export type InsertRevenue = z.infer<typeof insertRevenueSchema>;

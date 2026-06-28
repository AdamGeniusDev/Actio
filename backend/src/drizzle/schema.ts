import { boolean, index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Forme imposée par l'adaptateur Drizzle de better-auth — ne pas renommer
// sans mettre à jour lib/auth.ts.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (table) => [
  index("session_user_id_idx").on(table.userId),
]);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
  index("account_user_id_idx").on(table.userId),
]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("verification_identifier_idx").on(table.identifier),
]);

// Minimal par design : juste ce qu'il faut pour envoyer une alerte à l'heure
// prévue — jamais de copie de la tâche.
export const notificationChannel = pgEnum("notification_channel", ["sms", "whatsapp", "email", "push"]);
export const notificationStatus = pgEnum("notification_status", ["pending", "sent", "failed", "cancelled"]);

export const pendingNotifications = pgTable("pending_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  clientTaskId: text("client_task_id").notNull(), // référence opaque, pas une vraie FK
  garantContact: text("garant_contact").notNull(),
  channel: notificationChannel("channel").notNull(),
  message: text("message").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: notificationStatus("status").notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("pending_notifications_due_idx").on(table.status, table.scheduledAt), // job de dispatch
  index("pending_notifications_user_idx").on(table.userId),
]);

// Statut uniquement — aucune donnée de paiement, Moneroo/LemonSqueezy gèrent ça.
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  isPro: boolean("is_pro").notNull().default(false),
  provider: text("provider").notNull().default("moneroo"),
  providerSubscriptionId: text("provider_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

const schema = {
  user,
  session,
  account,
  verification,
  pendingNotifications,
  subscriptions,
};

export default schema;

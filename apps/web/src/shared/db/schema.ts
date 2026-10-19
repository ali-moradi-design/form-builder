import type { FormDocument } from "@formweave/schema";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const created = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updated = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// Tables read and written by Better Auth (names of its core schema).

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: created(),
  updatedAt: updated(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: created(),
  updatedAt: updated(),
});

// formweave tables.

/** A form and its working draft. Published versions are kept in `form_version`. */
export const form = pgTable(
  "form",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    draft: jsonb("draft").$type<FormDocument>().notNull(),
    /** Public address `/f/<slug>`; set on the first publish. */
    slug: text("slug").unique(),
    /** Number of the newest published version, or null. */
    liveVersion: integer("live_version"),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [index("form_owner_idx").on(t.ownerId, t.updatedAt)],
);

/** An immutable published version of a form. */
export const formVersion = pgTable(
  "form_version",
  {
    id: text("id").primaryKey(),
    formId: text("form_id")
      .notNull()
      .references(() => form.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    document: jsonb("document").$type<FormDocument>().notNull(),
    createdAt: created(),
  },
  (t) => [uniqueIndex("form_version_unique").on(t.formId, t.version)],
);

/** One submission, tied to the version it was filled in. */
export const response = pgTable(
  "response",
  {
    id: text("id").primaryKey(),
    formId: text("form_id")
      .notNull()
      .references(() => form.id, { onDelete: "cascade" }),
    versionId: text("version_id")
      .notNull()
      .references(() => formVersion.id, { onDelete: "cascade" }),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    locale: text("locale"),
    createdAt: created(),
  },
  (t) => [index("response_form_idx").on(t.formId, t.createdAt)],
);

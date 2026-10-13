import { relations } from 'drizzle-orm';
import {
  integer,
  pgTable,
  serial,
  varchar,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  code: varchar('code', {length: 50}).notNull().unique(),
  name: varchar('name', {length: 255}).notNull().unique(),
  description: varchar('description', {length: 500}).notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subjects = pgTable(
  'subjects',
  {
    id: serial('id').primaryKey(),
    code: varchar('code',{length: 50}).notNull().unique(),
    name: varchar('name', {length: 255}).notNull(),
    description: varchar('description', {length: 500}).notNull().default(''),
    departmentId: integer('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique('subjects_department_name_unique').on(table.departmentId, table.name)],
);

export const departmentsRelations = relations(departments, ({ many }) => ({
  subjects: many(subjects),
}));

export const subjectsRelations = relations(subjects, ({ one }) => ({
  department: one(departments, {
    fields: [subjects.departmentId],
    references: [departments.id],
  }),
}));

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;
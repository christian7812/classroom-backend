import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, pool } from "./db/index.js";
import { departments, subjects } from "./db/schema/index.js";

async function main() {
  let createdDepartmentId: number | undefined;
  let createdSubjectId: number | undefined;

  try {
    console.log("Performing CRUD operations...");

    const [department] = await db
      .insert(departments)
      .values({
        code: `DEMO-${randomUUID().slice(0, 8)}`,
        name: "Demo Department",
        description: "Department created by the CRUD example.",
      })
      .returning();

    if (!department) {
      throw new Error("Failed to create department");
    }
    createdDepartmentId = department.id;

    const [subject] = await db
      .insert(subjects)
      .values({
        departmentId: department.id,
        code: `DEMO-${randomUUID().slice(0, 8)}`,
        name: "Demo Subject",
        description: "Subject created by the CRUD example.",
      })
      .returning();

    if (!subject) {
      throw new Error("Failed to create subject");
    }
    createdSubjectId = subject.id;
    console.log("CREATE:", { department, subject });

    const [foundSubject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subject.id));
    console.log("READ:", foundSubject);

    const [updatedSubject] = await db
      .update(subjects)
      .set({ name: "Updated Demo Subject" })
      .where(eq(subjects.id, subject.id))
      .returning();

    if (!updatedSubject) {
      throw new Error("Failed to update subject");
    }
    console.log("UPDATE:", updatedSubject);

    await db.delete(subjects).where(eq(subjects.id, subject.id));
    createdSubjectId = undefined;
    await db
      .delete(departments)
      .where(eq(departments.id, department.id));
    createdDepartmentId = undefined;
    console.log("DELETE: Subject and department deleted.");
    console.log("CRUD operations completed successfully.");
  } catch (error) {
    console.error("Error performing CRUD operations:", error);
    process.exitCode = 1;
  } finally {
    if (createdSubjectId !== undefined) {
      try {
        await db.delete(subjects).where(eq(subjects.id, createdSubjectId));
      } catch (cleanupError) {
        console.error("Failed to clean up the demo subject:", cleanupError);
        process.exitCode = 1;
      }
    }

    if (createdDepartmentId !== undefined) {
      try {
        await db
          .delete(departments)
          .where(eq(departments.id, createdDepartmentId));
      } catch (cleanupError) {
        console.error("Failed to clean up the demo department:", cleanupError);
        process.exitCode = 1;
      }
    }

    await pool.end();
  }
}

void main();

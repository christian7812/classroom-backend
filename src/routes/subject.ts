import express from "express";
import { and, count, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import { departments, subjects } from "../db/schema/index.js";

const router = express.Router();

const parsePositiveInteger = (value: unknown, fallback: number): number => {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value.trim())) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
};

router.get("/", async (req, res) => {
  try {
    const { search, department, page = "1", limit = "10" } = req.query;

    const currentPage = parsePositiveInteger(page, 1);
    const limitPerPage = parsePositiveInteger(limit, 10);
    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions: SQL[] = [];

    // Search subject names or course codes.
    if (typeof search === "string" && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      const searchCondition = or(
        ilike(subjects.name, searchPattern),
        ilike(subjects.code, searchPattern),
      );

      if (searchCondition) {
        filterConditions.push(searchCondition);
      }
    }

    // Filter by department name.
    if (typeof department === "string" && department.trim()) {
      filterConditions.push(
        ilike(departments.name, `%${department.trim()}%`),
      );
    }

    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const [data, countResults] = await Promise.all([
      db
        .select({
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
          description: subjects.description,
          departmentId: subjects.departmentId,
          department: departments.name,
          createdAt: subjects.createdAt,
          updatedAt: subjects.updatedAt,
        })
        .from(subjects)
        .innerJoin(departments, eq(subjects.departmentId, departments.id))
        .where(whereClause)
        .limit(limitPerPage)
        .offset(offset),
      db
        .select({ total: count() })
        .from(subjects)
        .innerJoin(departments, eq(subjects.departmentId, departments.id))
        .where(whereClause),
    ]);
    const countResult = countResults[0];
    if (!countResult) {
      throw new Error("Failed to count matching subjects");
    }

    const totalPages = Math.ceil(countResult.total / limitPerPage);

    res.status(200).json({
      data,
      total: countResult.total,
      page: currentPage,
      limit: limitPerPage,
      totalPages,
    });
  } catch (error) {
    console.error("GET /subjects error:", error);
    res.status(500).json({ error: "Failed to get subjects" });
  }
});

export default router;

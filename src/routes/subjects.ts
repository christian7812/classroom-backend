import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '../db/index.js';
import { departments, subjects } from '../db/schema/index.js';

const subjectsRouter = Router();
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parsePositiveInteger(value: unknown, fallback: number): number | null {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

subjectsRouter.get('/', async (req, res) => {
  const page = parsePositiveInteger(req.query.page, DEFAULT_PAGE);
  const limit = parsePositiveInteger(req.query.limit, DEFAULT_LIMIT);
  const search = req.query.search;
  const department = req.query.department;

  if (page === null || limit === null || limit > MAX_LIMIT) {
    res.status(400).json({
      error: `page and limit must be positive integers; limit cannot exceed ${MAX_LIMIT}`,
    });
    return;
  }

  if (
    (search !== undefined && typeof search !== 'string') ||
    (department !== undefined && typeof department !== 'string')
  ) {
    res.status(400).json({ error: 'search and department must be single string values' });
    return;
  }

  const offset = (page - 1) * limit;
  if (!Number.isSafeInteger(offset)) {
    res.status(400).json({ error: 'Requested page is too large' });
    return;
  }

  const filters: SQL[] = [];
  const searchTerm = search?.trim();
  const departmentCode = department?.trim();

  if (searchTerm) {
    const searchFilter = or(
      ilike(subjects.name, `%${searchTerm}%`),
      ilike(subjects.code, `%${searchTerm}%`),
    );
    if (searchFilter) {
      filters.push(searchFilter);
    }
  }

  if (departmentCode) {
    filters.push(eq(departments.code, departmentCode));
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  try {
    const [countResult, subjectList] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(subjects)
        .innerJoin(departments, eq(subjects.departmentId, departments.id))
        .where(whereClause),
      db
        .select({
          id: subjects.id,
          code: subjects.code,
          name: subjects.name,
          description: subjects.description,
          department: departments.code,
          createdAt: subjects.createdAt,
        })
        .from(subjects)
        .innerJoin(departments, eq(subjects.departmentId, departments.id))
        .where(whereClause)
        .orderBy(desc(subjects.createdAt), desc(subjects.id))
        .limit(limit)
        .offset(offset),
    ]);

    const totalCount = countResult[0]?.count ?? 0;

    res.status(200).json({
      data: subjectList,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/subjects failed:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

export default subjectsRouter;

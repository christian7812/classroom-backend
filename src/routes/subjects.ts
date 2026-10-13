import { eq, ilike, or,and, sql, getTableColumns, desc } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '../db/index.js';
import {departments, subjects } from '../db/schema/index.js';

const subjectsRouter = Router();

//GET all subjects with optional search, filtering and pagination

subjectsRouter.get('/', async (req, res) => {
    
    try{

        const {search, department, page = 1, limit = 10} = req.query;
        const currentPage = Math.max(1, +page);
        const limitPerPage = Math.max(1, +limit);
        const offset = (currentPage - 1) * limitPerPage;

        //Where to store our filtered conditons
        const filterConditions = [];

        //If search query exist,filter by subject name or codes
       if (search) {
  filterConditions.push(
    or(
      ilike(subjects.name, `%${search}%`),
      ilike(subjects.code, `%${search}%`)
    )
  );
}

    //If department exist,match department name 
    if (department) {
  filterConditions.push(ilike(departments.name, `%${department}%`));
}
     
   //Combine filters if they exist using the AND operator
   const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

   const countResult = await db
   .select({count: sql<number>`count(*)`})
   .from(subjects)
   .leftJoin(departments, eq(subjects.departmentId, departments.id))
   .where(whereClause);

   const totalCount = countResult[0]?.count ?? 0;
    

   //Querying the data

   const subjectList = await db
   .select(
    {...getTableColumns(subjects), 
    department:{...getTableColumns(departments)}})
    .from(subjects)
    .leftJoin(departments, eq(subjects.departmentId, departments.id))
    .where(whereClause)
    .orderBy(desc(subjects.createdAt))
    .limit(limitPerPage).offset(offset);

res.status(200).json({
    data: subjectList,
    pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage)
    }
})

    }catch(e) {
        console.error(`GET /subjects error: ${e}`);
        res.status(500).json({error: 'Failed to get subjects'})
    }

});

export default subjectsRouter;
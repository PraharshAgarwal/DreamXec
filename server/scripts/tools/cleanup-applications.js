const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function cleanupApplications() {
  try {
    console.log('🔍 Checking for applications with null or invalid userId...');
    
    // Use raw MongoDB query to find applications with null userId
    const invalidApplications = await prisma.$runCommandRaw({
      find: 'Application',
      filter: {
        $or: [
          { userId: null },
          { userId: { $exists: false } }
        ]
      }
    });
    
    console.log(`Found ${invalidApplications.cursor.firstBatch.length} invalid applications with null userId`);
    
    if (invalidApplications.cursor.firstBatch.length > 0) {
      console.log('Invalid applications:', invalidApplications.cursor.firstBatch.map(app => ({
        id: app._id,
        donorProjectId: app.donorProjectId,
        createdAt: app.createdAt
      })));
      
      // Delete applications with null userId using raw query
      const deleteResult = await prisma.$runCommandRaw({
        delete: 'Application',
        deletes: [{
          q: {
            $or: [
              { userId: null },
              { userId: { $exists: false } }
            ]
          },
          limit: 0
        }]
      });
      
      console.log(`✅ Deleted ${deleteResult.n} invalid applications`);
    }
    
    // Check for applications where userId exists but user doesn't exist
    console.log('🔍 Checking for applications with invalid userId references...');
    
    const allApplications = await prisma.$runCommandRaw({
      aggregate: 'Application',
      pipeline: [
        {
          $lookup: {
            from: 'User',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $match: {
            user: { $size: 0 }
          }
        }
      ],
      cursor: {}
    });
    
    const orphanedApps = allApplications.cursor.firstBatch;
    
    if (orphanedApps.length > 0) {
      console.log(`⚠️  Found ${orphanedApps.length} applications with invalid user references`);
      console.log('Orphaned applications:', orphanedApps.map(app => ({
        id: app._id,
        userId: app.userId,
        donorProjectId: app.donorProjectId
      })));
      
      // Delete orphaned applications
      const orphanIds = orphanedApps.map(app => app._id);
      const deleteOrphans = await prisma.$runCommandRaw({
        delete: 'Application',
        deletes: [{
          q: {
            _id: { $in: orphanIds }
          },
          limit: 0
        }]
      });
      
      console.log(`✅ Deleted ${deleteOrphans.n} orphaned applications`);
    } else {
      console.log('✅ All applications have valid user references');
    }
    
    console.log('🎉 Database cleanup completed');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupApplications();
// Migration script to add branch field to existing database
// Run this with: node scripts/migrate_branch_field.js

import { sequelizeCon } from '../src/init/dbConnection.js';
import { Admin } from '../src/models/admin.model.js';
import Student from '../src/models/student.model.js';

async function migrateBranchField() {
  try {
    console.log('🚀 Starting branch field migration...');

    // Sync the models to add the new branch columns
    await sequelizeCon.sync({ alter: true });
    console.log('✅ Database schema updated with branch fields');

    // Optional: Set default branch for existing admins
    const adminsWithoutBranch = await Admin.findAll({
      where: {
        branch: null
      }
    });

    if (adminsWithoutBranch.length > 0) {
      console.log(`📝 Found ${adminsWithoutBranch.length} admins without branch. Setting default branch...`);
      
      await Admin.update(
        { branch: 'Main Branch' },
        { 
          where: { branch: null }
        }
      );
      
      console.log('✅ Updated existing admins with default branch');
    }

    // Optional: Set default branch for existing students
    const studentsWithoutBranch = await Student.findAll({
      where: {
        branch: null
      }
    });

    if (studentsWithoutBranch.length > 0) {
      console.log(`📝 Found ${studentsWithoutBranch.length} students without branch. Setting default branch...`);
      
      await Student.update(
        { branch: 'Main Branch' },
        { 
          where: { branch: null }
        }
      );
      
      console.log('✅ Updated existing students with default branch');
    }

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelizeCon.close();
  }
}

// Run the migration
migrateBranchField();
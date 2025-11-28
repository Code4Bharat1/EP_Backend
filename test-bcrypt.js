// test-fixed-hooks.js
import Student from './src/models/student.model.js';
import bcrypt from 'bcrypt';

async function testFixedHooks() {
  try {
    const studentId = 182;
    const newPassword = 'yogu';
    
    //console.log('=== TESTING FIXED HOOKS ===');
    
    // Find the student
    const student = await Student.findByPk(studentId);
    if (!student) {
      ////console.log('Student not found');
      return;
    }
    
    //console.log('Found student:', student.emailAddress);
    //console.log('Current password hash:', student.password);
    
    // Update the password normally (with hooks enabled)
    //console.log('\nUpdating password with hooks enabled...');
    await student.update({ password: newPassword });
    
    // Check the updated password
    const updatedStudent = await Student.findByPk(studentId);
    //console.log('Updated password hash:', updatedStudent.password);
    
    // Test the password
    const isMatch = await bcrypt.compare(newPassword, updatedStudent.password);
    //console.log('Password match:', isMatch);
    
    //console.log('\n=== END TESTING FIXED HOOKS ===');
    
  } catch (error) {
    console.error('Error testing fixed hooks:', error);
  }
}

testFixedHooks();
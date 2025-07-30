import bcrypt from 'bcrypt'

// test-bcrypt.js

async function check() {
  const plain = 'y2003';
  const hash  = '$2b$10$XXCoe15QaVRCmLZrbz1O7O0TQLeMPmcBnba3yG9/qixyHr7u0P89m';

  console.log('Hash length:', hash.length);
  console.log('Hash JSON:', JSON.stringify(hash));  
  const ok = await bcrypt.compare(plain, hash);
  console.log('Compare result:', ok);
}
check();

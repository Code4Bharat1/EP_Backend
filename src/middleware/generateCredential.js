import crypto from "crypto";

const generateRandomUserId = (name) => {
   
    const namePart = (name || 'XXXX').slice(0, 4).toUpperCase();
    const numberPart = Array.from(
      { length: 3 }, 
      () => Math.floor(Math.random() * 10)
    ).join('');
    
    return `${namePart}${numberPart}`;
  };

  const generateRandomPassword = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    return Array.from(
      { length: 8 }, 
      () => characters[Math.floor(Math.random() * characters.length)]
    ).join('');
  };

 const  generateRandomPasswordofStudent =()=> {
  return crypto.randomBytes(6).toString("hex");
 }

  export {generateRandomUserId,generateRandomPassword, generateRandomPasswordofStudent};
import bcrypt from "bcrypt";

const hashPassword = async (plain) => {
  const saltRounds = 10;
  return bcrypt.hash(plain, saltRounds);
};

export default hashPassword;
 
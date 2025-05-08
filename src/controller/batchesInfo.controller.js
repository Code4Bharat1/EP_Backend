import { Admin } from "../models/admin.model.js";
import jwt from "jsonwebtoken"
const batchesInfo = () => {

  const addedByAdminId= "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzQ2Njg5MzE5LCJleHAiOjE3NDkyODEzMTl9._zKntnotwvem-EXhDl0xoVmC1yyKf8_DmEiz7zDfer0"

  let decodedAdminId = null;
  if (addedByAdminId) {
    const decoded = jwt.decode(
      addedByAdminId
    ); // Decode the token
    if (decoded && decoded.id) {
      decodedAdminId = decoded.id; // Extract the ID from the decoded token
    }
  }

  // If the decoded ID is not found, set it to null (or handle error as needed)
  const adminId =
    decodedAdminId || null;
  console.log(adminId);
};

export { batchesInfo };

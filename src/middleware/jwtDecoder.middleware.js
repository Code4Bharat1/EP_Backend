// // jwtDecoder.middleware.js

// import jwt from "jsonwebtoken";
// import config from "config";

// export const verifyToken = (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "Authorization token missing or malformed" });
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     /*
//       ──────────────────────────────────────────
//        ROLE HANDLING
//       ──────────────────────────────────────────
//       Token possibilities:
//       1) Admin -> { id, email, role: "admin" }
//       2) Admin Student -> { id, email, adminId: 10 }
//       3) Public Student -> { id, email }
//     */

//     // 1️⃣ ADMIN
//     if (decoded.role === "admin") {
//       req.userType = "admin";
//       req.user = {
//         adminId: decoded.id, // admin's own ID
//       };
//       return next();
//     }

//     // 2️⃣ STUDENT ADDED BY ADMIN
//     if (decoded.adminId) {
//       req.userType = "student";
//       req.user = {
//         studentId: decoded.id,
//         adminId: decoded.adminId,
//       };
//       return next();
//     }

//     // 3️⃣ PUBLIC STUDENT (self signup)
//     req.userType = "public-student";
//     req.user = {
//       studentId: decoded.id,
//     };

//     return next();

//   } catch (err) {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };


// jwtDecoder.middleware.js

import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Authorization token missing or malformed" });
  }

  const token = authHeader.split(" ")[1];
  try {
    // ✅ ✅ ✅ ONLY ONE SECRET IN WHOLE PROJECT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /*
      ──────────────────────────────────────────
       ROLE HANDLING
      ──────────────────────────────────────────
      Token possibilities:
      1) Admin -> { id, email, role: "admin" }
      2) Admin Student -> { id, email, adminId }
      3) Public Student -> { id, email }
    */

    // 1️⃣ ADMIN
    if (decoded.role === "admin") {
      req.userType = "admin";
      req.user = {
        adminId: decoded.id,
      };
      req.admin = {
        id: decoded.id, // Support both token formats
      };
      return next();
    }

    // 2️⃣ STUDENT ADDED BY ADMIN
    if (decoded.adminId) {
      req.userType = "student";
      req.user = {
        studentId: decoded.id,
        adminId: decoded.adminId,
      };
      return next();
    }

    // 3️⃣ PUBLIC STUDENT
    req.userType = "public-student";
    req.user = {
      studentId: decoded.id,
    };

    return next();
  } catch (err) {
    console.error("❌ JWT VERIFY ERROR:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

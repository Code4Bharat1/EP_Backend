import express from "express";
import { demoSignup , sendOtp , verifyOtp } from "../controller/demo.controller.js";
const route = express.Router();


route.post("/signup",demoSignup)
route.post("/sendotp",sendOtp)
route.post("/verifyotp",verifyOtp)

export default route;
import axios from "axios";
import dotenv from "dotenv";
dotenv.config(); // Ensure environment variables are loaded

const WHATSAPP_INSTANCE_ID = process.env.WHATSAPP_INSTANCE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const formatNumber = (number) => {
  number = number.replace(/\D/g, "");
  if (number.length === 10) return "91" + number;
  if (number.length === 12 && number.startsWith("91")) return number;
  return number;
};

export const sendWhatsAppMessage = async (number, message) => {
  try {
    const formattedNumber = formatNumber(number);
    console.log("Formatted number:", formattedNumber); // Debug formatted number

    const payload = {
      number: formattedNumber,
      type: "text",
      message,
      instance_id: WHATSAPP_INSTANCE_ID,
      access_token: WHATSAPP_ACCESS_TOKEN,
    };

    console.log("📤 Sending WhatsApp payload:", payload);

    const res = await axios.post("https://app.simplywhatsapp.com/api/send", payload, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("✅ WhatsApp sent:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ WhatsApp error:", error?.response?.data || error.message);
    return null;
  }
};

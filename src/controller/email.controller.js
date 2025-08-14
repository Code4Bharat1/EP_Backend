import { sendEmail } from "../service/nodeMailerConfig.js";

export const sendemail = async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    // Quick guard + helpful debug
    if (!to || !subject || (!text && !html)) {
      console.log("POST /email bad body:", req.body);
      return res
        .status(400)
        .json({ message: "Missing required email fields." });
    }

    const info = await sendEmail({ to, subject, text, html });
    return res.status(200).json({ ok: true, id: info.messageId });
  } catch (err) {
    console.error("POST /email error:", err);
    return res
      .status(500)
      .json({ message: "Email send failed.", error: err.message });
  }
};
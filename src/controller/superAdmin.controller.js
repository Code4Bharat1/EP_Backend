import { Admin } from "../models/admin.model.js";

const getAdminList = async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: ["AdminId", "Email", "ExpiryDate"], // only these fields
      order: [["ExpiryDate", "ASC"]], // optional: sorts by expiry date
    });

    return res.status(200).json({ admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};


const deleteAdminById = async (req, res) => {
    const { AdminId } = req.body;
  
    if (!AdminId) {
      return res.status(400).json({ message: "AdminId is required." });
    }
  
    try {
      const deleted = await Admin.destroy({
        where: { AdminId },
      });   
  
      if (deleted === 0) {
        return res.status(404).json({ message: "Admin not found." });
      }
  
      return res.status(200).json({ message: `Admin with ID ${AdminId} has been deleted.` });
    } catch (error) {
      console.error("Error deleting admin:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  };

export {getAdminList, deleteAdminById};
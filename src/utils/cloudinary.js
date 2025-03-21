import { v2 as cloudinary} from "cloudinary";
import { response } from "express";
import fs from "fs" //file system in node.js by default
import config from 'config';

const cloudinaryauth = config.get('cloudinaryauth');

cloudinary.config({ 
    cloud_name: cloudinaryauth.name, 
    api_key: cloudinaryauth.api_key, 
    api_secret: cloudinaryauth.api_secret
});


const uploadOnCloudinary= async(locaalFilePath)=>{
    try {
        
        if (!locaalFilePath) return null
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(locaalFilePath,{
            resource_type:"auto"
        })
        //now file has been uploaded now we'll console log a message
        // console.log(`file is uplaoded on cloudinary ${response.url}`);
        await fs.unlinkSync(locaalFilePath)
        return response;
        
    } catch (error) {
        fs.unlinkSync(locaalFilePath)//remove the locally saved temporary file as the upload operation got failed
        return null
    }
}

const deleteOnCloudinary = async (url) => {
    try {
      const urlParts = url.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExtension.split('.')[0];
      // Delete the file using the public_id
      const response = await cloudinary.uploader.destroy(publicId);
      

      return response
    } 
    catch (error) {
        return null;
    }
  };

  
export{uploadOnCloudinary, deleteOnCloudinary}
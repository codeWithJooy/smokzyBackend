const AWS = require('aws-sdk');
const fs = require('fs');
const util = require('util');


// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

const uploadFileToS3 = async (file) => {
  
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Body: file.buffer,
    Key: `${Date.now()}_${file.originalname}`,
    ContentType: file.mimetype
  };

  try {
    console.log("Upload Params are ",uploadParams)
    const result = await s3.upload(uploadParams).promise();
    return result.Location;
  } catch (error) {
    console.log("File Upload Error Is:",error.message)
    throw error;
  }
};

const uploadMultipleFilesToS3 = async (files) => {
  return Promise.all(files.map(file => uploadFileToS3(file)));
};

module.exports = {
  uploadFileToS3,
  uploadMultipleFilesToS3
};
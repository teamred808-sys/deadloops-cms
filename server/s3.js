const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Initialize S3 Client
const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Uploads a file to S3/R2
 * @param {string} filePath - Absolute path to the local file
 * @param {string} filename - Desired filename in the bucket
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string|null>} - Public URL if successful, null otherwise
 */
async function uploadFileToS3(filePath, filename, mimeType) {
    try {
        // 1. Check if S3 credentials are configured
        if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_BUCKET_NAME) {
            console.warn('⚠️ R2 credentials missing. Skipping object storage upload.');
            return null;
        }

        // 2. Read file stream
        const fileStream = fs.createReadStream(filePath);

        // 3. Upload parameters
        const uploadParams = {
            Bucket: process.env.R2_BUCKET_NAME,
            Key: filename,
            Body: fileStream,
            ContentType: mimeType,
            // ACL: 'public-read' // Not strictly needed for R2 if bucket is public, but good for S3
        };

        // 4. Send command
        await s3Client.send(new PutObjectCommand(uploadParams));

        // 5. Construct Public URL
        // Use configured public URL or fallback to endpoint/bucket
        const publicUrlBase = process.env.R2_PUBLIC_URL;
        if (publicUrlBase) {
            // Ensure no double slashes
            const baseUrl = publicUrlBase.replace(/\/$/, '');
            return `${baseUrl}/${filename}`;
        }

        // Fallback? R2 usually needs a custom domain or worker for public access.
        // If user didn't provide R2_PUBLIC_URL, we can't guess easily.
        console.warn('⚠️ R2_PUBLIC_URL not defined. Returning null (will fallback to local).');
        return null;

    } catch (error) {
        console.error('❌ S3 Upload Error:', error);
        return null; // Fallback to local
    }
}

module.exports = { uploadFileToS3 };

const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const Document = require('../models/Document');

// Initialize S3 client
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.S3_REGION,
});

// View document in browser (PDF)
router.get('/documents/view/:id', async (req, res) => {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).send('Document not found');

    const signedUrl = s3.getSignedUrl('getObject', {
        Bucket: process.env.S3_BUCKET,
        Key: doc.downloadUrl, // ← Now this is just the key: "rate-confirmations/F-76388_RateConfirmation.pdf"
        Expires: 300,
        ResponseContentDisposition: 'inline', // <- VIEW in browser
        ResponseContentType: 'application/pdf'
    });

    res.redirect(signedUrl);
});


module.exports = router;

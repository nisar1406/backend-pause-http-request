import express from 'express';
import FileUploadController from '../controller/fileUpload';

const router = express.Router();

router.post('/upload', FileUploadController.uploadFile);

router.get('/upload-status', FileUploadController.getUploadingFileDetails);

router.post('/upload-request', FileUploadController.uploadRequest);

export default router;

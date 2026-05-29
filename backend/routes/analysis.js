import express from 'express';
import { analyzeSong, getAnalysisHistory, getAnalysisById, getTrendingSearches } from '../controllers/analysisController.js';

const router = express.Router();
router.post('/analyze', analyzeSong);
router.get('/history', getAnalysisHistory);
router.get('/trending', getTrendingSearches);
router.get('/analysis/:id', getAnalysisById);

export default router;

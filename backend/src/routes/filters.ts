import { Router } from 'express';
import { FilterController } from '../controllers/filterController';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Public endpoints - allow guests to browse with optional auth for user-specific filtering
router.get('/disciplines', FilterController.getDisciplines);
router.get('/options', optionalAuthenticate, FilterController.getFilterOptions);
router.get('/trending', optionalAuthenticate, FilterController.getTrendingSearches);

export default router;

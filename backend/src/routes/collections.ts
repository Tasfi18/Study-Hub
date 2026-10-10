import { Router } from 'express';
import { CollectionsController } from '../controllers/collectionsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Collection CRUD
router.get('/', CollectionsController.getCollections);
router.post('/', CollectionsController.createCollection);
router.get('/:id', CollectionsController.getCollectionById);
router.delete('/:id', CollectionsController.deleteCollection);

// Add/Remove materials
router.post('/:id/materials', CollectionsController.addMaterial);
router.delete('/:id/materials/:materialId', CollectionsController.removeMaterial);

export default router;

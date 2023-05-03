import express from 'express';

import product from './product';
import user from './user';

const router = express.Router();

router.use('/product', product);
router.use('/user', user);

export default router;
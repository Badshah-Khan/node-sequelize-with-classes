import express from 'express';

import { models } from '../lib/db';

const product = express.Router();

const {Product} = models;

product.post('/create', Product.create);
// product.get('/products', Product.get);

export default product;
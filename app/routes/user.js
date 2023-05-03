import express from 'express';

import { models } from '../lib/db';

const user = express.Router();

const { User } = models;

user.post('/signup', User.create);
user.post('/login', User.login);

export default user;
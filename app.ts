import express from 'express';
import cors from 'cors';
import config from 'config';

import db from './app/lib/db';
import router from './app/routes';

const app = express();

app.use(cors());
app.use(express.json());

const { sequelize } = db;

const port = config.has('port') ? config.get('port') : 3001;

sequelize.authenticate().then(() => {
    console.log('db connected successfully');
    sequelize.sync({ force: true }).then(() => {
        console.log('Tables created successfully!');
        app.use('/', router);

        app.listen(port, () => {
            console.log(`server is running on http://localhost:${port}`);
        })
    }).catch((err: any) => {
        console.log('Table Creating Error', err);
    })
}).catch((err: any) => {
    console.log('db connection error', err);
});





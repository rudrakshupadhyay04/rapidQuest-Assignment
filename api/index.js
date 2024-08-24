import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoClient} from 'mongodb';
import router from './routes/routes.js';


dotenv.config();

const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri).then(()=>{
    console.log("mongoDB is connected!!!")
}).catch((error) => {
    console.log(error);
})



const app = express();

const dbName = 'RQ_Analytics';
const client = new MongoClient(mongoUri);
const db = client.db(dbName);


app.use(express.json());

app.listen(3000, () => {
    console.log("server is running on port 3000");
})


app.use('/api/analytics',router)
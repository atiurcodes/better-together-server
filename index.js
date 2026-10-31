import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import 'dotenv/config'

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.error('MongoDB connection failed:', err);
        throw err;
    }
}
const mongoClient = await connectToMongoDB();
const db = mongoClient.db('eventManagement');
const eventCollection = db.collection('events');

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/event/add-event', async (req, res) => {
    const data = req.body;
    const result = await eventCollection.insertOne(data);
    res.send(result);
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
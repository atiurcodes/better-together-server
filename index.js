import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'
import { createRemoteJWKSet, jwtVerify } from 'jose';

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
const joinedEventCollection = db.collection('Joined');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ msg: 'Unauthorized!1' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).send({ msg: 'Unauthorized!1' });
    }

    const JWKS = createRemoteJWKSet(new URL('http://localhost:3000/api/auth/jwks'));
    try {

        const { payload } = await jwtVerify(token, JWKS);
        next();

    } catch (error) {
        return res.status(401).send({ msg: 'Unauthorized!2' });
    }
}

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/upcoming-event', async (req, res) => {
    const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dhaka",
    }).format(new Date());

    const allEvent = await eventCollection.find({
        eventDate: {
            $gte: today
        }
    }).sort({ eventDate: 1 }).toArray();
    res.send(allEvent);
})

app.get('/recent-upcoming-event', async (req, res) => {
    const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dhaka",
    }).format(new Date());

    const allEvent = await eventCollection.find({
        eventDate: {
            $gte: today
        }
    }).sort({ eventDate: 1 }).limit(6).toArray();
    res.send(allEvent);
})

app.get(`/upcoming-event/:id`, async (req, res) => {
    const { id } = req.params;
    const eventDetails = await eventCollection.findOne({ _id: new ObjectId(id) });
    res.send(eventDetails);
})

app.post('/event/add-event', verifyToken, async (req, res) => {
    const data = req.body;
    const result = await eventCollection.insertOne(data);
    res.send(result);
})

app.get('/my-event/:email', verifyToken, async (req, res) => {
    const { email } = req.params;
    const myEvent = await eventCollection.find({ organizerEmail: email }).toArray();
    res.send(myEvent);
})

app.patch('/my-event/edit/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    const result = await eventCollection.updateOne({ _id: new ObjectId(id) }, {
        $set: updatedData
    })
    res.send(result);
})

app.delete('/delete-event/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const result = await eventCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
})

app.get('/joined-events/:email', verifyToken, async (req, res) => {
    const { email } = req.params;
    const result = await joinedEventCollection.find({ userEmail: email }).toArray();
    res.send(result)
})

app.post('/join-event', verifyToken, async (req, res) => {
    const data = req.body;
    const alreadyJoined = await joinedEventCollection.findOne({
        eventId: data.eventID,
        userEmail: data.userEmail
    });

    if (alreadyJoined) {
        return res.status(409).send({
            message: "Already joined this event"
        });
    }
    const result = await joinedEventCollection.insertOne(data);
    res.send(result);
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
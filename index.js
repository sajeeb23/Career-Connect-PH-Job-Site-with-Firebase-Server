const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jfzu9vq.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const jobsCollection = client.db('jobsDB').collection('jobs');

    app.get('/jobs', async (req, res) => {
      const cursor = jobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/jobs/category/:category', async (req, res) => {
      try {
        const category = req.params.category;
        const query = { category: category };
        const cursor = jobsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error('Error in /jobs/category/:category:', error);
        res.status(500).send('Internal Server Error');
      }
    });

    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;

     
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectID:', id);
        return res.status(400).send('Invalid ObjectID');
      }

      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    app.post('/jobs', async (req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });

    app.put('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const updateJobs = req.body;

      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectID:', id);
        return res.status(400).send('Invalid ObjectID');
      }

      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };

      const job = {
        $set: {
          email: updateJobs.email,
          job_title: updateJobs.job_title,
          category: updateJobs.category,
          deadline: updateJobs.deadline,
          description: updateJobs.description,
          minimum_price: updateJobs.minimum_price,
          maximum_price: updateJobs.maximum_price,
        },
      };

      const result = await jobsCollection.updateOne(filter, job, option);
      res.send(result);
    });

    app.delete('/jobs/:id', async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectID:', id);
        return res.status(400).send('Invalid ObjectID');
      }

      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    });

    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Ensure to close the client when done
    // await client.close();
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

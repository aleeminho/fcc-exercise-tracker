require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const userSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String,
  }]
})

const User = mongoose.model('User', userSchema)

const logSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: String,
})

const Log = mongoose.model('Log', logSchema)

app.get('/api/users', async (req, res) => {
  const users = await User.find({})
  const user = []
  users.forEach(data => {
    user.push({
      _id: data._id,
      username: data.username,
    })
  })
  try {
    res.json(user)
  } catch (e) {
    res.sendStatus(500).json(e)
  }
})


app.post('/api/users', async (req, res) => {
  const newUser = new User({
    username: req.body.username
  })

  try {
    await newUser.save()
    res.json({ _id: newUser._id, username: newUser.username })

  } catch (e) {
    res.sendStatus(500).json(e)
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const filteredUser = await User.findById(req.params._id)
  const logItems = new Log({
    userId: filteredUser._id,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString()
  })
  try {
    await logItems.save()
    filteredUser.description = req.body.description
    filteredUser.duration = req.body.duration
    filteredUser.date = req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString()
    filteredUser.count = filteredUser.log.length
    await filteredUser.save()

    const exercise = {
      _id: filteredUser._id,
      username: filteredUser.username,
      description: filteredUser.description,
      duration: filteredUser.duration,
      date: filteredUser.date
    }

    res.json(exercise)
  } catch (e) {
    res.sendStatus(500).json(e)
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query
  const filteredUser = await User.findById(req.params._id)
  const filteredLog = await Log.find({ userId: req.params._id }).limit(limit)
  try {
    const logMenu = {
      username: filteredUser.username,
      count: '',
      _id: filteredUser._id,
      log: []
    }
    filteredLog.forEach(e => logMenu.log.push(e))
    logMenu.count = logMenu.log.length
    res.json(logMenu)
  } catch (e) {
    res.sendStatus(500).json(e)
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

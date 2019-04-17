const Task = require('data.task')
const fetchComments = require('./src/index')
const fs = require('fs')
const mongo = require('mongodb').MongoClient



// const fetchAllComments = (videoId, pageToken, fetched = []) => fetchComments(videoId, pageToken)
//   .chain(({ comments, nextPageToken }) => nextPageToken
//     ? fetchAllComments(videoId, nextPageToken, fetched.concat(comments))
//     : Task.of(fetched.concat(comments)))


const url = ''
const args = process.argv.slice(2)
const vid = args[0]

const hrstart = process.hrtime()
const date_stamp = new Date().toISOString().replace(/:/g,'-').substring(0, 19)


mongo.connect(url, {useNewUrlParser: true}, (err, client) => {
  if (err) {
    console.error(err)
    return
  }
  const db = client.db('youtube_comment')
  const collection = db.collection(vid)

  function saveComments(comments, nextPageToken) {
    return new Task(function(reject, resolve) {
      const savedDateTime = new Date()
      const comment2 = Object.assign({}, {comments}, {nextPageToken}, {savedDateTime})
      collection.insertOne(comment2, (err, result) => {
        if (err) {
          reject(err)
        }
        // console.log(result)
        console.log(`${comments.length} Saved.`)
        resolve(comment2)
      })
    })
  }

  const fetchAllComments = (videoId, pageToken) => fetchComments(videoId, pageToken)
    .chain(({ comments, nextPageToken}) => saveComments(comments, nextPageToken))
    .chain(({ comments, nextPageToken }) => nextPageToken? fetchAllComments(videoId, nextPageToken): Task.of(comments))

  collection.find().sort({savedDateTime:-1}).limit(1).toArray((err, items) => {
    let token = null
    if (items) {
      token = items[0]
    }
    fetchAllComments(vid, token)
      .fork(e => console.error('ERROR', e),
         comments => saveComments(comments)
      )
  })
})


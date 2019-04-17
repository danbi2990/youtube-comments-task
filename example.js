const Task = require('data.task')
const fetchComments = require('./src/index')
const fs = require('fs')

const fetchAllComments = (videoId, pageToken, fetched = []) => fetchComments(videoId, pageToken)
  .chain(({ comments, nextPageToken }) => nextPageToken
    ? fetchAllComments(videoId, nextPageToken, fetched.concat(comments))
    : Task.of(fetched.concat(comments)))


const hrstart = process.hrtime()
const date_stamp = new Date().toISOString().replace(/:/g,'-').substring(0, 19)
const vid = 'h_tkIpwbsxY'

fetchAllComments(vid)
  .fork(e => console.error('ERROR', e),
     allComments => fs.writeFile(`${vid}_${date_stamp}.json`, JSON.stringify(allComments), 'utf8',
       function(err){
         if(err) {
           console.log("Error during saving json to file")
           return console.log(err)
         }

         const hrend = process.hrtime(hrstart)
         console.log("Succeeded taken: ", hrend)
       }
     )
   )

    // allComments => console.log(allComments))

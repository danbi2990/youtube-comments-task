const { expect } = require('chai')
const cheerio = require('cheerio')

const fetchComments = require('../../lib/fetch-comments')

const validateComment = c => {
  expect(c).to.have.property('id').that.is.a('string').of.length.at.least(1)
  expect(c).to.have.property('author').that.is.a('string').of.length.at.least(1)
  expect(c).to.have.property('authorLink').that.is.a('string').of.length.at.least(1)
  expect(c).to.have.property('authorThumb').that.is.a('string').of.length.at.least(1)
  expect(c).to.have.property('text').that.is.a('string').of.length.at.least(1)
  expect(c).to.have.property('likes').that.is.a('number').of.at.least(0)
  expect(c).to.have.property('time').that.is.a('string').of.length.at.least(1)
  expect(c).to.have.property('timestamp').that.is.a('number').above(0)
}

describe('/lib/comment-stream', function () {
  this.timeout(30000)

  it('fetches first page of comments (no pageToken)', done => {
    const videoId = '9bZkp7q19f0'
    fetchComments(videoId)
      .fork(e => done('Got an error: ' + e),
        p => {
          expect(p).to.have.property('comments').that.is.an('array').of.length.above(1)
          expect(p).to.have.property('nextPageToken').that.is.a('string').of.length.above(1)

          p.comments.forEach(c => {
            validateComment(c)
            expect(c).to.have.property('hasReplies').that.is.a('boolean')
            if (c.hasReplies) {
              expect(c).to.have.property('replies').that.is.an('array').of.length(c.numReplies)
              expect(c).to.have.property('numReplies').that.is.a('number').that.is.equal(c.replies.length)
              c.replies.forEach(validateComment)
            }
          })
          done()
        })
  })

  it('fetches next page of comments (with pageToken)', done => {
    const videoId = '9bZkp7q19f0'
    fetchComments(videoId)
      .chain(({ nextPageToken }) => fetchComments(videoId, nextPageToken))
      .fork(e => done('Got an error: ' + e),
        p => {
          expect(p).to.have.property('comments').that.is.an('array').of.length.above(1)
          expect(p).to.have.property('nextPageToken').that.is.a('string').of.length.above(1)

          p.comments.forEach(c => {
            validateComment(c)
            expect(c).to.have.property('hasReplies').that.is.a('boolean')
            if (c.hasReplies) {
              expect(c).to.have.property('replies').that.is.an('array').of.length(c.numReplies)
              expect(c).to.have.property('numReplies').that.is.a('number').that.is.equal(c.replies.length)
              c.replies.forEach(validateComment)
            }
          })
          done()
        })
  })
})
const Rx = require('rxjs')
const Task = require('data.task')
const Either = require('data.either')
const prop = require('propper')
const cheerio = require('cheerio')

const eitherToTask = require('./utils/either-to-task')
const fetchFirstPageToken = require('./fetch-first-page-token')
const { commentPage } = require('./youtube-api/youtube-api')

const getContentHtml = response =>
  Either.fromNullable(prop(response, 'content_html'))
    .leftMap(_ => 'API response does not contain a "content_html" field')

const getLoadMoreWidgetHtml = response =>
  Either.fromNullable(prop(response, 'load_more_widget_html'))
    .leftMap(_ => 'API response does not contain a "load_more_widget_html" field')

const extractButtonElement = html =>
  Either.fromNullable(cheerio.load(html)('button.comment-section-renderer-paginator'))
    .leftMap(_ => 'Comment page HTML does not contain the "Load More" button')

const extractTokenAttribute = $btn =>
  Either.fromNullable($btn.attr('data-uix-load-more-post-body'))
    .leftMap(_ => 'The comment page "Load More" button does not have the token attribute')

const extractNextPageToken = page =>
  getLoadMoreWidgetHtml(page)
    .chain(extractButtonElement)
    .chain(extractTokenAttribute)
    .map(token => token.replace(/^page_token=/i, ''))
    .map(token => decodeURIComponent(token))
    .chain(token => Task.of(token))

const observerEmitPage = observer => page =>
  getContentHtml(page)
    .orElse(Task.rejected)
    .map(html => observer.next(html))
    .chain(() => Task.of(page))

const buildCommentPageStream = videoId =>
  Rx.Observable.create(observer => {
    const emitPage = observerEmitPage(observer)

    const fetchAllPages = pageToken =>
      commentPage(videoId, pageToken)
        .chain(emitPage)
        .chain(p =>
          extractNextPageToken(p)    // if extractNextPageToken "fails" the
            .chain(fetchAllPages)    // Observable is complete and we don't want
            .orElse(Task.of))        // to propagate an error.

    fetchFirstPageToken(videoId)
      .chain(fetchAllPages)
      .fork(e => observer.error(e), _ => observer.complete())
  })

module.exports = buildCommentPageStream
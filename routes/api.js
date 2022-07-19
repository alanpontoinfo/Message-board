'use strict'

const BoardModel = require('../modelos').Board
const ThreadModel = require('../modelos').Thread
const ReplyModel = require('../modelos').Reply

module.exports = function (app) {
  app
    .route('/api/threads/:board')
    .post((req, res) => {
      const { text, delete_password } = req.body
      let board = req.body.board
      if (!board) {
        board = req.params.board
      }
      console.log('post', req.body)
      const newThread = new ThreadModel({
        text: text,
        delete_password: delete_password,
        replies: [],
      })
      console.log('newThread', newThread)
      BoardModel.findOne({ name: board }, (err, Boarddata) => {
        if (!Boarddata) {
          const newBoard = new BoardModel({
            name: board,
            threads: [],
          })
          console.log('newBoard', newBoard)
          newBoard.threads.push(newThread)
          newBoard.save((err, data) => {
            console.log('newBoardData', data)
            if (err || !data) {
              console.log(err)
              res.send('There was an error saving in post')
            } else {
              res.json(newThread)
              /*  const url =
                'https://' + req.headers.host + '/b/' + req.params.board + '/'
              res.redirect(url)*/
            }
          })
        } else {
          Boarddata.threads.push(newThread)
          Boarddata.save((err, data) => {
            if (err || !data) {
              res.send('There was an error saving in post')
            } else {
              res.json(newThread)
              /* const url =
                'https://' + req.headers.host + '/b/' + req.params.board + '/'
              res.redirect(url)*/
            }
          })
        }
      })
    })
    .get((req, res) => {
      const board = req.params.board
      BoardModel.findOne({ name: board }, (err, data) => {
        if (!data) {
          console.log('No board with this name')
          res.json({ error: 'No board with this name' })
        } else {
          const threads = data.threads.map((thread) => {
            const { _id, text, created_on, bumped_on, replies } = thread
            replies.sort((first, second) =>
              first.created_on < second.created_on ? 1 : -1
            )
            let thisReplies = []
            for (let i = 0; i < 3 && i < replies.length; i++) {
              let reply = {}
              const { _id, text, created_on } = replies[i]
              reply._id = _id
              reply.text = text
              reply.created_on = created_on
              thisReplies.push(reply)
            }
            thisReplies.reverse()
            return {
              _id,
              text,
              created_on,
              bumped_on,
              replies: thisReplies,
              replycount: replies.length,
            }
          })
          threads.sort((first, second) =>
            first.bumped_on < second.bumped_on ? 1 : -1
          )
          let thisThreads = []
          for (let i = 0; i < 10 && i < threads.length; i++) {
            thisThreads.push(threads[i])
          }
          // console.log("Returned Threads: ");
          // console.log(thisThreads);
          res.json(thisThreads)
        }
      })
    })
    /* .get((req, res) => {
      const board = req.params.board
      BoardModel.findOne({ name: board }, (err, data) => {
        if (!data) {
          console.log('No board with this name')
          res.json({ error: 'No board with this name' })
        } else {
          console.log('data', data)
          const threads = data.threads.map((thread) => {
            const {
              _id,
              text,
              created_on,
              bumped_on,
              reported,
              delete_password,
              replies,
            } = thread
            return {
              _id,
              text,
              created_on,
              bumped_on,
              reported,
              delete_password,
              replies,
              replycount: thread.replies.length,
            }
          })
          res.json(threads)
        }
      })
    })*/
    .put((req, res) => {
      console.log('put', req.body)
      const { report_id } = req.body
      const board = req.params.board
      BoardModel.findOne({ name: board }, (err, boardData) => {
        if (!boardData) {
          res.json('error', 'Board not found')
        } else {
          const date = new Date()
          let reportedThread = boardData.threads.id(report_id)
          reportedThread.reported = true
          reportedThread.bumped_on = date
          boardData.save((err, updatedData) => {
            res.send('reported')
          })
        }
      })
    })
    .delete((req, res) => {
      console.log('delete', req.body)
      const { thread_id, delete_password } = req.body
      const board = req.params.board
      BoardModel.findOne({ name: board }, (err, boardData) => {
        if (!boardData) {
          res.json('error', 'Board not found')
        } else {
          let threadToDelete = boardData.threads.id(thread_id)
          if (threadToDelete.delete_password === delete_password) {
            threadToDelete.remove()
          } else {
            res.send('incorrect password')
            return
          }
          boardData.save((err, upadatedData) => {
            res.send('success')
          })
        }
      })
    })

  app
    .route('/api/replies/:board')
    .post((req, res) => {
      console.log('thread', req.body)
      const { thread_id, text, delete_password } = req.body
      const board = req.params.board
      const date = new Date().toUTCString()
      const newReply = new ReplyModel({
        text: text,
        delete_password: delete_password,
        created_on: date,
        bumped_on: date,
        reported: false,
      })
      BoardModel.findOne({ name: board }, (err, boardData) => {
        if (!boardData) {
          res.json('error', 'Board not found')
        } else {
          const date = new Date().toUTCString()
          let addReplyTothread = boardData.threads.id(thread_id)
          addReplyTothread.bumped_on = date
          addReplyTothread.replies.push(newReply)
          boardData.save((err, updatedData) => {
            res.json(updatedData)
            /* const url = 'https://' +  req.headers.host + '/b/' + req.params.board + '/' + req.body.thread_id
            // console.log(url);
            res.redirect(url)*/
          })
        }
      })
    })
    .get((req, res) => {
      const board = req.params.board
      BoardModel.findOne({ name: board }, (err, data) => {
        if (!data) {
          console.log('No board with this name')
          res.json({ error: 'No board with this name' })
        } else {
          console.log('data', data)
          const thread = data.threads.id(req.query.thread_id)
          const { _id, text, created_on, bumped_on, replies } = thread
          let thisReplies = []
          for (let i = 0; i < replies.length; i++) {
            let reply = {}
            const { _id, text, created_on } = replies[i]
            reply._id = _id
            reply.text = text
            reply.created_on = created_on
            thisReplies.push(reply)
          }
          let newThread = {}
          newThread._id = _id
          newThread.text = text
          newThread.created_on = created_on
          newThread.bumped_on = bumped_on
          newThread.replies = [...thisReplies]
          newThread.replycount = replies.length
          res.json(newThread)
          // res.json(thread)
        }
      })
    })
    .put((req, res) => {
      const { thread_id, reply_id } = req.body
      const board = req.params.board
      BoardModel.findOne({ name: board }, (err, data) => {
        if (!data) {
          console.log('No board with this name')
          res.json({ error: 'No board with this name' })
        } else {
          console.log('data', data)
          const date = new Date()
          let thread = data.threads.id(thread_id)
          let reply = thread.replies.id(reply_id)
          reply.reported = true
          reply.created_on = date
          reply.bumped_on = date
          data.save((err, updatedData) => {
            if (!err) {
              res.send('reported')
            }
          })
        }
      })
    })
    .delete((req, res) => {
      const { thread_id, reply_id, delete_password } = req.body
      console.log('delete reply body', req.body)
      const board = req.params.board
      BoardModel.findOne({ name: board }, (err, data) => {
        if (!data) {
          console.log('No board with thi s name')
          res.json({ error: 'No board with this name' })
        } else {
          console.log('data', data)
          let thread = data.threads.id(thread_id)
          let reply = thread.replies.id(reply_id)
          if (reply.delete_password === delete_password) {
            reply.text = '[deleted]'
            // reply.add('<p>' + '[deleted]' + '</p>')
          } else {
            res.send('incorrect password')
            return
          }
          data.save((err, updatedData) => {
            if (err) {
              console.log('Error in DELETE request: ')
              console.log(err)
            }
            res.send('success')
          })
        }
      })
    })
}

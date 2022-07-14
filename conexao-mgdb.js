const mongoose = require('mongoose')
const db = mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

console.log('Connectado Api Database Distribuidor - Conexão inicial')

module.exports = db

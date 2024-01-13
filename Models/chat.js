const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    message: {
        type: String
    }
})

const chatSchema = new mongoose.Schema({
    users: {
        type: String,
        required: true
    },
    messages: [messageSchema]
})

const Chat = mongoose.model('Chat',chatSchema)

module.exports = Chat
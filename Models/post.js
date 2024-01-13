const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
    username: {
        type: String
    },
    content: {
        type: String
    }
})
const likeSchema = new mongoose.Schema({
    username: {
        type: String
    }
})

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    imageURL: {
        type:String
    },
    date: {
        type: Date,
        default: Date.now
    },
    comments: [commentSchema],
    likes: [likeSchema],
    dislikes: [likeSchema]
})

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
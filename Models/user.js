const mongoose = require('mongoose')

const friendSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    pfpUrl: {
        type: String
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    friends: [friendSchema],
    friendRequests: [friendSchema],
    unreads: [friendSchema]

})

const User = mongoose.model('User',userSchema)
module.exports = User
const User = require('../Models/user')

const sendFriendRequest = async (userId,friendId) => {
    const user = await User.findById(userId)
    if(user.friends.some(request => request.userId.toString() === friendId))
    {
        throw new Error('User is already a friend.')
    }
    if(user.friendRequests.some(request => request.userId.toString() === friendId))
    {
        throw new Error('User has already sent you a friend request.')
    }
    const friend = await User.findById(friendId)
    if(!friend)
    {
        throw new Error('User not found.')
    }
    if(friend.friendRequests.some(request => request.userId.toString() === userId))
    {
        throw new Error('You have already sent this user a friend request')
    }
    friend.friendRequests.push({userId})
    await friend.save()
}
const searchUsers = async (userId,keyword) => {
    let users = await User.find({username: {$regex: keyword, $options: 'i'}}).select('username pfpUrl')
    users = users.filter(user => user._id.toString() !== userId)
    return users
}
const getFriendRequests = async (userId) => {
    const user = await User.findById(userId).select('friendRequests')
    const users = user.friendRequests
    let returnArr = []
    for (const element of users){
        const requestingUser = await User.findById(element.userId).select('username pfpUrl')
        returnArr.push(requestingUser)
    }
    return returnArr
}
const acceptRequest = async (userId, friendId) => {
    const user = await User.findById(userId)
    const friend = await User.findById(friendId)

    user.friends.push({userId: friendId})
    friend.friends.push({userId})

    user.friendRequests = user.friendRequests.filter((i) => i.userId.toString() !== friendId)
    
    await user.save()
    await friend.save()
}
const declineRequest = async (userId, friendId) => {
    const user = await User.findById(userId)

    user.friendRequests = user.friendRequests.filter((i) => i.userId.toString() !== friendId)

    await user.save()
}

const getFriends = async (userId) => {
    const user = await User.findById(userId).select('friends')
    const users = user.friends

    let returnArr = []
    for (const element of users){
        const requestingUser = await User.findById(element.userId).select('username pfpUrl')
        returnArr.push(requestingUser)
    }
    return returnArr
}

const removeFriend = async (userId,friendId) => {
    const user = await User.findById(userId)
    const friend = await User.findById(friendId)

    user.friends = user.friends.filter((i)=> i.userId.toString() !== friendId)
    friend.friends = user.friends.filter((i)=> i.userId.toString() !== userId)

    await user.save()
    await friend.save()
}

module.exports = {
    sendFriendRequest, searchUsers, getFriendRequests, acceptRequest, declineRequest, getFriends, removeFriend
}
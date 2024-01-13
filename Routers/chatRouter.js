const Chat = require('../Models/chat')

const saveMessage = async (userId,friendId, message) => {
    let chatId = ''
    if(userId < friendId)
    {
        chatId = userId + friendId
    }
    else
    {
        chatId = friendId + userId
    }
    let chat = await Chat.findOne({users: chatId})
    if(!chat)
    {
        chat = new Chat({
            users: chatId
        })
    }
    const newMessage ={
        sender: userId,
        message
    }
    chat.messages.push(newMessage)
    await chat.save()
}
const getMessages = async(userId,friendId) => {
    let chatId = ''
    if(userId<friendId)
    {
        chatId = userId + friendId
    }
    else{
        chatId = friendId + userId
    }
    const chat = await Chat.findOne({users: chatId})
    return chat
}

module.exports = {
    saveMessage, getMessages
}
const User = require('../Models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary').v2;

          
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARYCLOUDNAME, 
    api_key: process.env.CLOUDINARYAPIKEY, 
    api_secret: process.env.CLOUDINARYAPISECRET 
});

const signUp = async (username,password) => {
    try{
        const user = await User.findOne({username})
        if(user)
        {
            throw new Error('Username is already in use')
        }
        const hashedPassword = await bcrypt.hash(password,8)
        const newUser = new User({
            username, password: hashedPassword
        })
        await newUser.save()
    }catch(e){
        throw e
    }
}

const login = async (username,password) => {
    try{
        const user = await User.findOne({username})
        if(!user)
        {
            throw new Error('User not found')
        }
        const isMatch = await bcrypt.compare(password,user.password)
        if(!isMatch)
        {
            throw new Error('Incorrect password')
        }
        const token = jwt.sign({userId: user._id},process.env.JWTKEY)
        return token
    }catch(e){
        throw e
    }
}
const getUsername = async (userId) => {
    try{
        const user = User.findById(userId)
        return user
    }catch(e)
    {
        throw e
    }
}
const getUserDetails = async (userId) => {
    const user = User.findById(userId).select('username pfpUrl')
    return user
}

const addUnread = async (userId, friendId) => {
    const friend = await User.findById(friendId)
    if(!friend)
    {
        throw new Error('Friend does not exist')
    }
    friend.unreads.push({userId})
    await friend.save()
}

const getUnreads = async (userId) => {
    const user = await User.findById(userId).select('unreads')
    return user
}

const updateUnreads = async (userId, friendId) => {
    const user = await User.findById(userId)
    user.unreads = user.unreads.filter((i) => i.userId.toString() !== friendId)
    await user.save()
}

const getProfileDetails = async (username) => {
    const user = await User.findOne({username}).select('pfpUrl friends')
    if(!user)
    {
        throw new Error('User not found')
    }
    return user
}

const updateProfilePic = async (userId, image) => {
    const user = await User.findById(userId)
    if(user.pfpUrl)
    {
        const publicId = extractPublicIdFromURL(user.pfpUrl);
        await cloudinary.uploader.destroy(publicId);
    }
    const result = await cloudinary.uploader.upload(image);
    user.pfpUrl = result.secure_url
    await user.save()
}
// Helper function to extract public ID from Cloudinary URL for deleting old user profile pic
const extractPublicIdFromURL = (imageUrl) => {
    const segments = imageUrl.split('/');
    const lastSegment = segments[segments.length - 1];
    const publicId = lastSegment.split('.')[0];
    return publicId;
};


module.exports ={
    signUp, login, getUsername, getUserDetails, updateProfilePic, getProfileDetails, addUnread, getUnreads, updateUnreads
}
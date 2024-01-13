const Post = require('../Models/post')
const User = require('../Models/user')
const cloudinary = require('cloudinary').v2;

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARYCLOUDNAME, 
  api_key: process.env.CLOUDINARYAPIKEY, 
  api_secret: process.env.CLOUDINARYAPISECRET 
});

const addPost = async (title,content,image,ownerId) => {
    try{
        if(image)
        {
            const result = await cloudinary.uploader.upload(image);
            const newPost = new Post({title,content,imageURL:result.secure_url, owner: ownerId})
            await newPost.save()
        }
        else
        {
            const newPost = new Post({title,content, owner: ownerId})
            await newPost.save()
        }
        
    }catch(e)
    {
        throw e
    }
}

const getPosts = async (userId) => {
    try {
      const user = await User.findById(userId).select('friends');
  
      // Collect user IDs including the user's own ID
      const userIds = [userId, ...user.friends.map(friend => friend.userId)];
  
      // Fetch posts for all users (including the user and their friends) in a single query
      const posts = await Post.find({ owner: { $in: userIds } })
        .select('title content imageURL likes dislikes date');
  
      return posts;
    } catch (e) {
      throw e;
    }
};

const getUserPosts = async (username) => {
    const user = await User.find({username}).select('_id')
    const posts = await Post.find({owner: user}).select('title content imageURL likes dislikes date')
    return posts
}
  
const addComment = async (postId,comment,userId) => {
    try{
        const post = await Post.findById(postId)
        const user = await User.findById(userId)
        const username = user.username
        const newComment = {
            username,
            content : comment
        }
        post.comments.push(newComment)
        await post.save()
    }catch(e)
    {
        throw e
    }
}
const getComments = async (postId) => {
    try{
        const post = await Post.findById(postId)
        return post.comments
    }catch(e)
    {
        throw e
    }
}
const addLike = async(postId,userId) => {
    try{
        const user = await User.findById(userId)
        const username = user.username
        const post = await Post.findById(postId)

        let dislikes = post.dislikes
        if(dislikes.length !== 0){
            dislikes = dislikes.filter(user => user.username !== username)
        }
        
        const likes = post.likes
        likes.push({username})
        post.likes = likes
        post.dislikes = dislikes
        await post.save()
    }catch(e){
        throw e
    }
}
const addDislike = async(postId,userId) => {
    try{
        const user = await User.findById(userId)
        const username = user.username
        const post = await Post.findById(postId)

        let likes = post.likes
        if(likes.length !== 0){
            likes = likes.filter(user => user.username !== username)
        }

        const dislikes = post.dislikes
        dislikes.push({username})
        post.dislikes = dislikes
        post.likes = likes
        await post.save()
    }catch(e){
        throw e
    }
}
const removeLike = async(postId,userId) => {
    try {
        const user = await User.findById(userId)
        const username = user.username
        const post = await Post.findById(postId)

        let likes = post.likes
        if(likes.length!== 0)
        {
            likes = likes.filter(user => user.username !== username)
        }

        post.likes = likes
        await post.save()
    }catch(e){
        throw e
    }
}
const removeDislike = async(postId,userId) => {
    try {
        const user = await User.findById(userId)
        const username = user.username
        const post = await Post.findById(postId)

        let dislikes = post.dislikes
        if(dislikes.length!== 0)
        {
            dislikes = dislikes.filter(user => user.username !== username)
        }

        post.dislikes = dislikes
        await post.save()
    }catch(e){
        throw e
    }
}
const getPostOwner = async (postId) => {
    try {
        const post = await Post.findById(postId).select('owner')
        const userId = post.owner
        const user = await User.findById(userId).select('username pfpUrl')
        return user
    }catch(e)
    {
        throw e
    }
}
const deletePost = async(postId) => {
    try{
        const post = await Post.findById(postId)

        if(post.imageURL)
        {
            const publicId = extractPublicIdFromURL(post.imageURL);
            await cloudinary.uploader.destroy(publicId);
        }

        await Post.findByIdAndDelete(postId)
    }catch(e){
        throw e
    }
}
// Helper function to extract public ID from Cloudinary URL for deletePost
const extractPublicIdFromURL = (imageUrl) => {
    const segments = imageUrl.split('/');
    const lastSegment = segments[segments.length - 1];
    const publicId = lastSegment.split('.')[0];
    return publicId;
};

module.exports = {addPost, getPosts, addComment, getComments, addLike, 
    addDislike, removeLike, removeDislike , getPostOwner, deletePost, getUserPosts}
const express = require('express')
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const cookieParser = require('cookie-parser')
require('dotenv').config();



const app = express()
const server = http.createServer(app);
const io = socketIO(server, {cors: {origin: '*'}});
const port = process.env.PORT || 3000;

const path = require("path");
app.use(express.static(path.join(__dirname, "build"))); // put this line of code in app.js


io.on('connection',(socket)=>{
    console.log('A user has connected')

    socket.on('join', (userId) => {
        socket.join(userId)
        console.log('User has connected with userId: ',userId)
    })

    socket.on('isOnline', (roomId, callback) => {
        const isOnline = io.sockets.adapter.rooms.has(roomId);
        callback(isOnline);
    });

    socket.on('chat message', ({message,toUserId,senderId})=>{
        io.to(toUserId).emit('chat message',{message,senderId})
    })

    socket.on('disconnect', ()=>{
        console.log('A user has disconnected')
    })
})
server.listen(5001, () => {
    console.log('Socket IO Server started on port 5001');
  });

const {signUp,login, getUsername, getUserDetails, updateProfilePic,
    getProfileDetails, getUnreads, addUnread, updateUnreads} = require('./Routers/userRouter')
const {addPost,getPosts,addComment, getComments, addLike,
     addDislike, removeLike, removeDislike, getPostOwner, deletePost, getUserPosts} = require('./Routers/postRouter')
const {sendFriendRequest,searchUsers, getFriendRequests, acceptRequest,
    declineRequest, getFriends, removeFriend} = require('./Routers/friendRouter')
const {saveMessage, getMessages} = require('./Routers/chatRouter')

const storage = multer.memoryStorage(); //Multer configuration
const upload = multer({ storage: storage });


mongoose.connect(process.env.DBURL)
app.use(express.json());
app.use(cookieParser())

const verifyToken = (req, res, next) => {
    const token = req.cookies.jwtToken;
    if (!token) {
        return res.status(401).json({message: 'Token not found'});
    }
    jwt.verify(token,process.env.JWTKEY, (error, decoded) => {
        if (error) {
            res.clearCookie('jwtToken', { path: '/' });
            return res.status(403).json({message: 'Invalid token'})
        }
        req.userId = decoded.userId;
        next();
    });
};

app.get('/checkjwt',verifyToken,(req,res)=>{ //Used for client side authentication
    res.status(200).send()
})

app.post('/signup',async (req,res)=>{
    try{
        const { username, password } = req.body;

        await signUp(username, password);
        res.status(200).send('Signup successful');
    }
    catch(e)
    {
        res.status(400).send(e.message)
    }
})
app.post('/login', async (req, res) => {
    try {
        res.clearCookie('jwtToken', { path: '/' });
        const { username, password } = req.body;
        const token = await login(username, password);

        res.cookie('jwtToken', token, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 3600000,
            path: '/'
        });
        res.status(200).send();
    } catch (e) {
        res.status(400).send(e.message);
    }
});

app.post('/logout',(req,res)=>{
    res.clearCookie('jwtToken', { path: '/' });
    res.status(200).send()
})
app.post('/comments',verifyToken,async (req,res)=>{
    try{
        const userId = req.userId
        const {postId,comment} = req.body
        await addComment(postId,comment,userId)
        res.status(200).send()
    }catch(e){
        res.status(400).send(e.message)
    }

})
app.get('/comments',verifyToken,async (req,res)=> {
    try{
        const {postId} = req.query
        const comments = await getComments(postId)
        res.status(200).json(comments)
    }catch(e){
        res.status(400).send(e.message)
    }
})
app.get('/posts',verifyToken,async (req,res)=>{
    try{
        const userId = req.userId
        const posts = await getPosts(userId)
        res.status(200).json(posts)
    }catch(e)
    {
        res.status(400).send(e.message)
    }
    
})
app.post('/posts',verifyToken,upload.single('image'),async (req,res)=>{
    try{
        const userId = req.userId
        const title = req.body.title
        const content = req.body.content

        if(req.file)
        {
            const imageBuffer = req.file.buffer

            const base64Image = imageBuffer.toString('base64');
            const tempImgUrl = `data:image/png;base64,${base64Image}`
    
            await addPost(title,content,tempImgUrl,userId)
        }
        else{
            await addPost(title,content,null,userId)
        }
        
        res.status(200).send()
    }catch(e)
    {
        res.status(400).send(e.message)
    }
    
})
app.post('/handlelikes',verifyToken,async (req,res)=>{
    try{
        const userId = req.userId
        const {postId,command} = req.body
        if(command === 'addLike')
        {
            await addLike(postId,userId)
        }
        else if(command === 'removeLike')
        {
            await removeLike(postId,userId)
        }
        else if(command === 'addDislike')
        {
            await addDislike(postId,userId)
        }
        else if(command === 'removeDislike')
        {
            await removeDislike(postId,userId)
        }
        res.status(200).send()
    }catch(e)
    {
        res.status(400).send(e.message)
    }
})
app.get('/getusername',verifyToken,async(req,res)=>{
    try{
        const username = await getUsername(req.userId)
        res.status(200).send(username)
    }catch(e)
    {
        res.status(400).send(e.message)
    }
})

app.get('/userdetails',verifyToken,async (req,res)=> {
    try{
        const userDetails = await getUserDetails(req.userId)
        res.status(200).json(userDetails)
    }catch(e)
    {
        res.status(400).send(e.message)
    }
})

app.get('/getPostOwner',verifyToken,async (req,res)=> {
    try{
        const {postId} = req.query
        const user = await getPostOwner(postId)
        res.status(200).json(user)
    }catch(e)
    {
        res.status(400).send(e.message)
    }
})
app.delete('/posts', verifyToken, async (req,res)=> {
    try{
        const {postId} = req.query
        await deletePost(postId)
        res.status(200).send()

    }catch(e){
        res.status(400).send(e.message)
    }
})
app.post('/friendrequest',verifyToken, async (req,res)=> {
    try {
        const userId = req.userId
        const {friendId} = req.body
        await sendFriendRequest(userId,friendId)
        res.status(200).send()
    }catch(e)
    {
        res.status(400).send(e.message)
    }
})
app.get('/friendrequest',verifyToken, async (req,res)=> {
    try{
        const userId = req.userId
        const users = await getFriendRequests(userId)
        res.status(200).json(users)
    }catch(e){
        res.status(400).send(e.message)
    }
})
app.get('/getusers',verifyToken,async (req,res)=> {
    try{
        const {keyword} = req.query
        const userId = req.userId
        const users = await searchUsers(userId,keyword)
        res.status(200).json(users)
    }catch(e){
        res.status(400).send(e.message)
    }
})
app.post('/managerequest',verifyToken,async (req,res)=>{
    try{
        const userId = req.userId
        const {friendId, command} = req.body
        if(command === 'y')
        {
            await acceptRequest(userId,friendId)
        }
        else if (command === 'n')
        {
            await declineRequest(userId,friendId)
        }
        
        res.status(200).send()
    }catch(e){
        res.status(400).send(e.message)
    }
})
app.get('/getfriends',verifyToken,async (req,res)=>{
    try{
        const userId = req.userId
        
        const friends = await getFriends(userId)
        res.status(200).json(friends)
    }catch(e){
        res.status(400).send(e.message)
    }
})
app.delete('/friends',verifyToken, async (req,res)=>{
    try{
        const userId = req.userId
        const {friendId} = req.query
        
        await removeFriend(userId,friendId)
        res.status(200).send()
    }catch(e){
        res.status(400).send(e.message)
    }
})

app.get('/userposts',verifyToken,async (req,res)=>{
    try{
        const {username} = req.query
        const posts = await getUserPosts(username)
        res.status(200).json(posts)
    }catch(e){
        res.status(400).send(e.message)
    }
})
app.get('/profiledetails',verifyToken,async (req,res)=>{
    try{
        const {username} = req.query
        const user = await getProfileDetails(username)
        res.status(200).json(user)
    }catch(e){
        res.status(400).send(e.message)
    }
})
app.patch('/profilepic',verifyToken,upload.single('image'),async (req,res)=>{
    try{
        const userId = req.userId
        if(req.file)
        {
            const imageBuffer = req.file.buffer

            const base64Image = imageBuffer.toString('base64');
            const tempImgUrl = `data:image/png;base64,${base64Image}`
    
            await updateProfilePic(userId,tempImgUrl)
        }
        res.status(200).send()
    }catch(e){
        res.status(400).send(e.message)
    }
})
app.post('/messages',verifyToken, async (req,res)=> {
    try{
        const userId = req.userId
        const {friendId,message} = req.body
        await saveMessage(userId,friendId,message)
        await addUnread(userId,friendId)
        res.status(200).send()
    }catch(e){
        res.status(400).send(e.message)
    }
})
app.get('/messages',verifyToken,async (req,res)=>{
    try{
        const userId = req.userId
        const {friendId} = req.query
        const chat = await getMessages(userId,friendId)
        res.status(200).json(chat)
    }catch(e){
        res.status(400).send(e.message)
    }
})

app.get('/unreads',verifyToken,async(req,res)=>{
    try{
        const userId = req.userId
        const unreads = await getUnreads(userId)
        res.status(200).json(unreads)
    }catch(e){
        res.status(400).send(e.message)
    }
})
app.post('/unreads',verifyToken,async(req,res)=>{
    try{
        const userId = req.userId
        const {friendId} = req.body
        await addUnread(userId,friendId)
        res.status(200).send()
    }catch(e){
        res.status(400).send(e.message)
    }
})
app.patch('/unreads',verifyToken,async(req,res)=>{
    try{
        
        const userId = req.userId
        const {friendId} = req.body
        await updateUnreads(userId,friendId)
        res.status(200).send()
    }catch(e){
        res.status(400).send(e.message)
    }
})

app.listen(port,()=>{
    console.log("Server started on port "+port)
})
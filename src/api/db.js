const mongoose = require('mongoose');

// db options
const user = process.env.API_DB_USER;
const pass = process.env.API_DB_PASSWORD;
const hostname = process.env.MONGO_DB_HOSTNAME
const mongodbPort = process.env.MONGO_DB_PORT
const database = process.env.DATABASE
const options = "retryWrites=true&authSource=admin"
const uri = `mongodb://${user}:${pass}@${hostname}:${mongodbPort}/${database}?${options}`

// connect to database
const conn = mongoose.createConnection(uri, { useUnifiedTopology: true } );

// set up models
const staticFileSchema = require('./schemas/staticFile.js');
const StaticFile = conn.model("StaticFile", staticFileSchema);

const userSchema = require('./schemas/user.js');
const User = conn.model("User", userSchema);

const postSchema = require('./schemas/post.js');
const Post = conn.model("Post", postSchema);

const postCommentSchema = require('./schemas/postComment.js');
const PostComment = conn.model("PostComment", postCommentSchema);

const postLikeSchema = require('./schemas/postLike.js');
const PostLike = conn.model("PostLike", postLikeSchema);

const communitySchema = require('./schemas/community.js');
const Community = conn.model("Community", communitySchema);

// exports
exports.conn = conn;
exports.StaticFile = StaticFile;

exports.User = User;

exports.Post = Post;
exports.PostComment = PostComment;
exports.PostLike = PostLike;

exports.Community;


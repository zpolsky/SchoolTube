var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({ 
	title: String,
	author: String,
	description: String,
	video: String,
	tag: String,
	likes: {type: Number, default: 0},
	comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

PostSchema.methods.like = function(cb) {
	this.likes += 1;
	this.save(cb);
}

PostSchema.methods.dislike = function(cb) {
	this.likes -= 1;
	this.save(cb);
}

mongoose.model('Post', PostSchema);

// var mongoose = require('mongoose');

// var PostSchema = mongoose.Schema({ 
// 	title: String,
// 	author: String,
// 	content: String,
// 	tag: String,
// 	video: String,
// 	likes: {type: Number, default: 0},
// 	comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
// });

// mongoose.model('Post', PostSchema);

// PostSchema.methods.like = function(cb) {
// 	console.log("in the like method for posts");
// 	this.like += 1;
// 	this.save(cb);
// };
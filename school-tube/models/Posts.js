var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({ 
	title: String,
	author: String,
	description: String,
	video: String,
	likes: {type: Number, default: 0},
	comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

mongoose.model('Post', PostSchema);
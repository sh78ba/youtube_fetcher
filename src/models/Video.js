const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    text: true // Enable text search
  },
  description: {
    type: String,
    required: true,
    text: true // Enable text search
  },
  publishedAt: {
    type: Date,
    required: true,
    index: -1 // Descending index for sorting
  },
  thumbnails: {
    default: {
      url: String,
      width: Number,
      height: Number
    },
    medium: {
      url: String,
      width: Number,
      height: Number
    },
    high: {
      url: String,
      width: Number,
      height: Number
    }
  },
  channelId: {
    type: String,
    required: true
  },
  channelTitle: {
    type: String,
    required: true
  },
  duration: String,
  viewCount: String,
  likeCount: String,
  tags: [String],
  categoryId: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound text index for better search performance
videoSchema.index({ 
  title: 'text', 
  description: 'text' 
}, {
  weights: {
    title: 10,
    description: 5
  }
});

// Compound index for efficient pagination
videoSchema.index({ publishedAt: -1, _id: 1 });

videoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Video', videoSchema);

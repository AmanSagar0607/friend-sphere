const User = require('../models/User');

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({ username: new RegExp(query, 'i') }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error searching users' });
  }
};

exports.sendFriendRequest = async (req, res) => {
  console.log('Received request:', {
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers,
    userId: req.userId
  });
  
  try {
    const { friendId } = req.body;
    console.log('Received friend request:', { userId: req.userId, friendId });
    
    if (!req.userId) {
      console.log('User ID not found in request');
      return res.status(401).json({ message: 'Authentication failed' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      console.log('User not found:', req.userId);
      return res.status(404).json({ message: 'User not found' });
    }

    const friend = await User.findById(friendId);
    if (!friend) {
      console.log('Friend not found:', friendId);
      return res.status(404).json({ message: 'Friend not found' });
    }

    if (friend.friendRequests.includes(req.userId)) {
      console.log('Friend request already sent:', { userId: req.userId, friendId });
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    friend.friendRequests.push(req.userId);
    await friend.save();

    console.log('Friend request sent successfully:', { userId: req.userId, friendId });
    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ message: 'Error sending friend request', error: error.message });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;
    const user = await User.findById(req.userId);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.friendRequests.includes(friendId)) {
      return res.status(400).json({ message: 'No friend request from this user' });
    }

    user.friendRequests = user.friendRequests.filter(id => id.toString() !== friendId);
    user.friends.push(friendId);
    friend.friends.push(req.userId);

    await user.save();
    await friend.save();

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting friend request' });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends', 'username');
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ message: 'Error getting friends' });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends');
    const friendIds = user.friends.map(friend => friend._id);
    
    const recommendations = await User.aggregate([
      { $match: { _id: { $nin: [...friendIds, user._id] } } } ,
      { $lookup: { from: 'users', localField: 'friends', foreignField: '_id', as: 'mutualFriends' } },
      { $project: { username: 1, mutualFriendsCount: { $size: { $setIntersection: ['$mutualFriends._id', friendIds] } } } } ,
      { $sort: { mutualFriendsCount: -1 } },
      { $limit: 5 }
    ]);

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Error getting recommendations' });
  }
};

exports.getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friendRequests', 'username');
    res.json(user.friendRequests);
  } catch (error) {
    res.status(500).json({ message: 'Error getting friend requests' });
  }
};

exports.rejectFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;
    const user = await User.findById(req.userId);

    if (!user.friendRequests.includes(friendId)) {
      return res.status(400).json({ message: 'No friend request from this user' });
    }

    user.friendRequests = user.friendRequests.filter(id => id.toString() !== friendId);
    await user.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting friend request' });
  }
};

exports.unfriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    const user = await User.findById(req.userId);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.friends = user.friends.filter(id => id.toString() !== friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== req.userId);

    await user.save();
    await friend.save();

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing friend' });
  }
};
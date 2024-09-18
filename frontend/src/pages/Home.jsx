import  { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';

function Card({ title, children }) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
      <h2 className="text-xl font-semibold bg-gray-700 p-4 border-b border-gray-600">{title}</h2>
      <div className="p-4">{children}</div>
    </div>
  );
}

Card.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

function UserCard({ user, onAction, actionText }) {
  return (
    <div className="flex justify-between items-center p-3 hover:bg-gray-700 rounded-lg transition duration-300">
      <span className="font-medium">{user.username}</span>
      <button
        onClick={() => onAction(user._id)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-sm transition duration-300 ease-in-out"
      >
        {actionText}
      </button>
    </div>
  );
}

UserCard.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
  }).isRequired,
  onAction: PropTypes.func.isRequired,
  actionText: PropTypes.string.isRequired,
};

function Home() {
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchFriends();
      fetchFriendRequests();
      fetchRecommendations();
    }
  }, [navigate]);

  const fetchFriends = async () => {
    try {
      const response = await axios.get('/api/users/friends', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFriends(response.data);
    } catch {
      console.error('Error fetching friends');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`/api/users/search?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
    } catch {
      console.error('Error searching users');
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  };

  const sendFriendRequest = async (friendId) => {
    try {
      await axios.post('/api/users/friend-request', { friendId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Request sent');
    } catch {
      toast.error('Failed to send request');
    }
  };

  const unfriend = async (friendId) => {
    try {
      await axios.post('/api/users/unfriend', { friendId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchFriends();
      toast.success('Friend removed');
    } catch {
      toast.error('Failed to remove friend');
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get('/api/users/friend-requests', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFriendRequests(response.data);
    } catch {
      console.error('Error fetching friend requests');
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get('/api/users/recommendations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRecommendations(response.data);
    } catch {
      console.error('Error fetching recommendations');
    }
  };

  const acceptFriendRequest = async (friendId) => {
    try {
      await axios.post('/api/users/accept-friend', { friendId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchFriendRequests();
      fetchFriends();
      toast.success('Request accepted');
    } catch {
      toast.error('Failed to accept request');
    }
  };

  const rejectFriendRequest = async (friendId) => {
    try {
      await axios.post('/api/users/reject-friend', { friendId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchFriendRequests();
      toast.success('Request rejected');
    } catch {
      toast.error('Failed to reject request');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Card title="Search Users">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full p-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
          />
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {users.map(user => (
              <UserCard
                key={user._id}
                user={user}
                onAction={sendFriendRequest}
                actionText="Add Friend"
              />
            ))}
          </div>
        </Card>
        <Card title="Friend Requests">
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {friendRequests.map(request => (
              <div key={request._id} className="flex justify-between items-center p-3 hover:bg-gray-700 rounded-lg transition duration-300">
                <span className="font-medium">{request.username}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => acceptFriendRequest(request._id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full text-sm transition duration-300 ease-in-out"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(request._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full text-sm transition duration-300 ease-in-out"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div>
        <Card title="Friends">
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {friends.map(friend => (
              <UserCard
                key={friend._id}
                user={friend}
                onAction={unfriend}
                actionText="Unfriend"
              />
            ))}
          </div>
        </Card>
        <Card title="Recommended Friends">
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {recommendations.map(recommendation => (
              <UserCard
                key={recommendation._id}
                user={{...recommendation, username: `${recommendation.username} (${recommendation.mutualFriendsCount} mutual)`}}
                onAction={sendFriendRequest}
                actionText="Add Friend"
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Home;
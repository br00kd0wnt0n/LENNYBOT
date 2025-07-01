// frontend/src/components/ActivityFeed.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MessageCircle, User, Clock, Hash } from 'lucide-react';
import api from '../utils/api';

const ActivityFeed = () => {
  const { channel } = useParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState(channel || 'main');
  const [limit, setLimit] = useState(50);

  const channels = [
    { id: 'main', label: 'Main Title', color: 'bg-blue-100 text-blue-800' },
    { id: 'production', label: 'Asset Production', color: 'bg-green-100 text-green-800' },
    { id: 'client', label: 'Client External', color: 'bg-purple-100 text-purple-800' }
  ];

  useEffect(() => {
    fetchActivityData();
  }, [selectedChannel, limit]);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/activity/${selectedChannel}?limit=${limit}`);
      setActivities(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch activity data:', error);
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'text-gray-500';
    if (sentiment.score > 0.3) return 'text-green-600';
    if (sentiment.score < -0.3) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSentimentEmoji = (sentiment) => {
    if (!sentiment) return '😐';
    if (sentiment.score > 0.3) return '😊';
    if (sentiment.score < -0.3) return '😟';
    return '😐';
  };

  const getPriorityColor = (priority) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    switch (priority.level) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Activity Feed</h1>
          <p className="text-gray-600 mt-2">
            Recent messages and AI analysis from project channels
          </p>
        </div>

        {/* Channel Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Channel:</label>
              <div className="flex space-x-2">
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedChannel === ch.id
                        ? ch.color
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Show:</label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value={25}>25 messages</option>
                <option value={50}>50 messages</option>
                <option value={100}>100 messages</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-600">Loading activity feed...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {activity.userName}
                        </h4>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          channels.find(ch => ch.id === activity.channelType)?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {channels.find(ch => ch.id === activity.channelType)?.label || activity.channelType}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <div className="mt-2">
                      <p className="text-gray-900">{truncateText(activity.text)}</p>
                    </div>

                    {/* AI Analysis Results */}
                    {activity.analysis && activity.analysis.processed && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          {/* Sentiment */}
                          {activity.analysis.sentiment && (
                            <div className="flex items-center">
                              <span className="text-gray-600 mr-2">Sentiment:</span>
                              <span className={getSentimentColor(activity.analysis.sentiment)}>
                                {getSentimentEmoji(activity.analysis.sentiment)} {activity.analysis.sentiment.label}
                              </span>
                            </div>
                          )}

                          {/* Priority */}
                          {activity.analysis.priority && (
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(activity.analysis.priority)}`}>
                              {activity.analysis.priority.level} priority
                            </span>
                          )}

                          {/* Intent */}
                          {activity.analysis.intent && (
                            <div className="flex items-center">
                              <span className="text-gray-600 mr-2">Intent:</span>
                              <span className="text-blue-600 font-medium">
                                {activity.analysis.intent.category}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Entities */}
                        {activity.analysis.entities && activity.analysis.entities.length > 0 && (
                          <div className="mt-3">
                            <span className="text-gray-600 text-sm mr-2">Entities:</span>
                            <div className="flex flex-wrap gap-1">
                              {activity.analysis.entities.map((entity, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                                >
                                  {entity.value} ({entity.type})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Items */}
                        {activity.analysis.actionItems && activity.analysis.actionItems.length > 0 && (
                          <div className="mt-3">
                            <span className="text-gray-600 text-sm font-medium">Action Items:</span>
                            <ul className="mt-1 space-y-1">
                              {activity.analysis.actionItems.map((item, idx) => (
                                <li key={idx} className="text-sm text-gray-700">
                                  • {item.task} {item.assignee && `(assigned to ${item.assignee})`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && activities.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-600">No activity found for this channel.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
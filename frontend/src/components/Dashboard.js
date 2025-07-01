// frontend/src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, TrendingUp, MessageCircle, Package } from 'lucide-react';
import api from '../utils/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [deliverablesData, setDeliverablesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchDeliverablesData();
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchDeliverablesData();
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/dashboard');
      setDashboardData(response.data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const fetchDeliverablesData = async () => {
    try {
      const response = await api.get('/api/deliverables');
      setDeliverablesData(response.data);
    } catch (error) {
      console.error('Failed to fetch deliverables data:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'concept': 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'review': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'delivered': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Project Dashboard</h1>
        {lastUpdated && (
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Deliverables Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Deliverables Tracking
          </h2>
          {deliverablesData && (
            <span className="text-sm text-gray-500">
              Total: {deliverablesData.total}
            </span>
          )}
        </div>

        {deliverablesData && deliverablesData.deliverables.length > 0 ? (
          <div className="space-y-4">
            {/* Status Summary */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              {Object.entries(deliverablesData.byStatus).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className={`text-2xl font-bold ${getStatusColor(status).split(' ')[1]}`}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {status.replace('-', ' ')}
                  </div>
                </div>
              ))}
            </div>

            {/* Deliverables List */}
            <div className="space-y-3">
              {deliverablesData.deliverables.slice(0, 10).map((deliverable, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{deliverable.name}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>Assignee: {deliverable.assignee || 'Unassigned'}</span>
                        <span>Deadline: {formatDate(deliverable.deadline)}</span>
                        <span>Channel: {deliverable.channelType}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(deliverable.status)}`}>
                      {deliverable.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No deliverables tracked yet</p>
            <p className="text-sm">Deliverables will appear here once messages are analyzed</p>
          </div>
        )}
      </div>

      {/* Activity Overview */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Activity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.todayActivity.reduce((sum, channel) => sum + channel.messageCount, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MessageCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Client Sentiment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.clientSentiment.avgSentiment > 0 ? '+' : ''}
                  {(dashboardData.clientSentiment.avgSentiment * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Urgent Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.urgentItems.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Urgent Items */}
      {dashboardData && dashboardData.urgentItems.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Urgent Items</h2>
          <div className="space-y-3">
            {dashboardData.urgentItems.map((item, index) => (
              <div key={index} className="border-l-4 border-red-500 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-900">{item.text}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {item.userName} • {item.channelType} • {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                    {item.analysis.priority.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
// frontend/src/components/TeamWorkload.js
import React, { useState, useEffect } from 'react';
import { Users, Clock, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const TeamWorkload = () => {
  const [workloadData, setWorkloadData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkloadData();
  }, []);

  const fetchWorkloadData = async () => {
    try {
      const response = await api.get('/api/team-workload');
      setWorkloadData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch workload data:', error);
      setLoading(false);
    }
  };

  const getWorkloadColor = (count) => {
    if (count >= 5) return 'bg-red-500';
    if (count >= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'concept': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading team workload...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Workload</h1>
          <p className="text-gray-600 mt-2">
            Current assignments and capacity across all team members
          </p>
        </div>

        {/* Workload Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{workloadData.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Active Deliverables</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workloadData.reduce((sum, member) => sum + member.activeDeliverables, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overloaded Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workloadData.filter(member => member.activeDeliverables >= 5).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Member Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {workloadData.map((member, index) => (
            <div key={index} className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{member._id}</h3>
                    <p className="text-sm text-gray-600">
                      Last active: {new Date(member.recentActivity).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className={`h-3 w-3 rounded-full ${getWorkloadColor(member.activeDeliverables)} mr-2`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {member.activeDeliverables} active
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h4 className="font-medium text-gray-900 mb-4">Current Deliverables</h4>
                {member.deliverables && member.deliverables.length > 0 ? (
                  <div className="space-y-3">
                    {member.deliverables.map((deliverable, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{deliverable.name}</h5>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deliverable.status)}`}>
                              {deliverable.status}
                            </span>
                            {deliverable.deadline && (
                              <span className={`text-xs ${isOverdue(deliverable.deadline) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                Due: {new Date(deliverable.deadline).toLocaleDateString()}
                                {isOverdue(deliverable.deadline) && (
                                  <span className="ml-1">⚠️</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No active deliverables</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {workloadData.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Activity</h3>
            <p className="text-gray-600">
              No team members with active deliverables found. Check back after some project activity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamWorkload;
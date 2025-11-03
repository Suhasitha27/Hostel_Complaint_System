import React, { useState, useEffect } from "react";
import API from "../api";
import { getStatusColor, getStatusBgColor } from "../utils/statusColor";

function StaffDashboard() {
  const [complaints, setComplaints] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchComplaints = async () => {
    const res = await API.get("/complaints/assigned");
    setComplaints(res.data);
  };

  const updateStatus = async (id, status) => {
    await API.put(`/complaints/${id}/status`, { status });
    fetchComplaints();
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  useEffect(() => {
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-green-700">Staff Dashboard</h2>
        <button
          onClick={logout}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 shadow-md"
        >
          Logout
        </button>
      </div>

      {/* Staff Info */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Welcome, {user.name}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-600">Name</p>
            <p className="text-lg font-bold text-blue-800">{user.name}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-600">Email</p>
            <p className="text-lg font-bold text-green-800">{user.email}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-600">Occupation</p>
            <p className="text-lg font-bold text-purple-800 capitalize">{user.staffType}</p>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {complaints.map((c) => (
          <div
            key={c._id}
            className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 ${getStatusBgColor(c.status)}`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-gray-800 leading-tight">{c.title}</h3>
                <span
                  className="text-white px-3 py-1 rounded-full font-semibold text-sm shadow-sm"
                  style={{ backgroundColor: getStatusColor(c.status) }}
                >
                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 w-20">Category:</span>
                  <span className="text-sm text-gray-800 capitalize">{c.category}</span>
                </div>

                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 w-20">Student:</span>
                  <span className="text-sm text-gray-800">{c.student?.email || "N/A"}</span>
                </div>

                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 w-20">Hostel:</span>
                  <span className="text-sm text-gray-800">{c.student?.hostelName || "N/A"}</span>
                </div>

                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 w-20">Room:</span>
                  <span className="text-sm text-gray-800">{c.student?.roomNumber || "N/A"}</span>
                </div>
              </div>

              {/* Status Buttons */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateStatus(c._id, "in-progress")}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition duration-200 text-sm font-medium"
                  >
                    Mark In Progress
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {complaints.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-gray-500 text-lg">
            No assigned complaints found.
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffDashboard;

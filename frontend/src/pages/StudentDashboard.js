import React, { useState, useEffect } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { getStatusColor, getStatusBgColor } from "../utils/statusColor";

function StudentDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("general");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchComplaints = async () => {
    const res = await API.get("/complaints/my");
    setComplaints(res.data);
  };

  const addComplaint = async () => {
    if (!title || !desc) return alert("Please fill title and description");
    await API.post("/complaints", { title, description: desc, category });
    setTitle("");
    setDesc("");
    setCategory("general");
    fetchComplaints();
  };

  const markResolved = async (id) => {
    try {
      await API.put(`/complaints/${id}/status`, { status: "resolved" });
      fetchComplaints();
    } catch (err) {
      alert("Failed to update complaint status");
    }
  };
  
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
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
        <h2 className="text-3xl font-bold text-orange-600">Student Dashboard</h2>
        <button
          onClick={logout}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 shadow-md"
        >
          Logout
        </button>
      </div>

      {/* Student Info */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Welcome, {user.name}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-600">Roll Number</p>
            <p className="text-lg font-bold text-blue-800">{user.rollNo}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-600">Hostel</p>
            <p className="text-lg font-bold text-green-800">{user.hostelName}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-600">Room</p>
            <p className="text-lg font-bold text-purple-800">{user.roomNumber}</p>
          </div>
        </div>
      </div>

      {/* Create Complaint */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Create New Complaint</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter complaint title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="general">General</option>
              <option value="electricity">Electricity</option>
              <option value="plumbing">Plumbing</option>
              <option value="carpentry">Carpentry</option>
            </select>
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
            placeholder="Describe your complaint in detail"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        <button
          onClick={addComplaint}
          className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 font-medium"
        >
          Submit Complaint
        </button>
      </div>

      {/* Complaints List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">My Complaints</h3>
        <div className="space-y-6">
          {complaints.map((c) => {
            const date = new Date(c.createdAt);
            const formattedDate = date.toLocaleDateString();
            const formattedTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            return (
              <div 
                key={c._id} 
                className={`rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-l-4 ${getStatusBgColor(c.status)}`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-lg text-gray-800">{c.title}</h4>
                    <span
                      className="text-white px-3 py-1 rounded-full font-semibold text-sm shadow-sm"
                      style={{ backgroundColor: getStatusColor(c.status) }}
                    >
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Category:</span>
                      <span className="text-sm text-gray-800 ml-2 capitalize">{c.category}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Date:</span>
                      <span className="text-sm text-gray-800 ml-2">{formattedDate} at {formattedTime}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-sm font-medium text-gray-600">Assigned Staff:</span>
                      <span className="text-sm text-gray-800 ml-2">
                        {c.assignedTo
                          ? `${c.assignedTo.name} (${c.assignedTo.staffType})`
                          : "Not assigned yet"}
                      </span>
                    </div>
                  </div>
                  
                  {c.status === "in-progress" && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => markResolved(c._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
                      >
                        Mark as Resolved
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;

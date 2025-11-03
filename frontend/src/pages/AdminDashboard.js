import React, { useState, useEffect } from "react";
import API from "../api";
import { getStatusColor, getStatusBgColor } from "../utils/statusColor";

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState({});
  const [selectedStaff, setSelectedStaff] = useState({});
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchComplaints = async () => {
  const res = await API.get("/complaints/all");
  let data = res.data;

  // Sort by status and assignment
  const statusOrder = { "pending": 0, "in-progress": 1, "resolved": 2 };
  data.sort((a, b) => {
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status]; // pending → in-progress → resolved
    }
    if (!a.assignedTo && b.assignedTo) return -1; // unassigned first
    if (a.assignedTo && !b.assignedTo) return 1;
    return 0; // same status & same assignment
  });

  setComplaints(data);

  // Fetch staff for each complaint
  data.forEach(async (c) => {
    let type = null;
    if (c.category === "electricity") type = "electrician";
    else if (c.category === "plumbing") type = "plumber";
    else if (c.category === "carpentry") type = "carpenter";

    const staffRes = await API.get(`/auth/staff${type ? `?staffType=${type}` : ""}`);
    setStaffList((prev) => ({ ...prev, [c._id]: staffRes.data }));
  });
};


  const assignComplaint = async (id) => {
    if (!selectedStaff[id]) return alert("Select staff to assign");
    await API.put(`/complaints/${id}/assign/${selectedStaff[id]}`);
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
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-blue-700">Admin Dashboard</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => window.location.href = "/admin/reports"}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 shadow-md"
          >
            View Reports
          </button>
          <button
            onClick={logout}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 shadow-md"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Admin Info */}
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
            <p className="text-sm font-medium text-purple-600">Role</p>
            <p className="text-lg font-bold text-purple-800 capitalize">{user.role}</p>
          </div>
        </div>
      </div>

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
                  <span className="text-sm font-medium text-gray-600 w-20">Assigned:</span>
                  <span className="text-sm text-gray-800">
                    {c.assignedTo
                      ? `${c.assignedTo.name} (${c.assignedTo.staffType})`
                      : "Unassigned"}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 w-20">Student:</span>
                  <span className="text-sm text-gray-800">{c.student.email}</span>
                </div>

                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 w-20">Date:</span>
                  <span className="text-sm text-gray-800">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {!c.assignedTo && (
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <select
                    value={selectedStaff[c._id] || ""}
                    onChange={(e) =>
                      setSelectedStaff((prev) => ({
                        ...prev,
                        [c._id]: e.target.value,
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select Staff</option>
                    {staffList[c._id]?.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.staffType})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => assignComplaint(c._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 text-sm font-medium"
                  >
                    Assign
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;

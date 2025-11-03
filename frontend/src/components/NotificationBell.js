import React, { useState, useEffect, useRef } from "react";
import API from "../api";

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.floor(hr / 24);
  return `${days}d`;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef();

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return; // don't poll when not authenticated
      
      setLoading(true);
      const res = await API.get("/notifications");
      
      // only show unread notifications in the bell
      const newNotes = res.data.filter((n) => !n.read);
      
      // Update state only if there are changes
      setNotes(prevNotes => {
        if (JSON.stringify(prevNotes) !== JSON.stringify(newNotes)) {
          return newNotes;
        }
        return prevNotes;
      });
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately on mount
    fetchNotes();
    
    // Set up polling every 10 seconds for more responsiveness
    const interval = setInterval(fetchNotes, 10000);
    
    // Also fetch when window regains focus
    const onFocus = () => fetchNotes();
    window.addEventListener('focus', onFocus);
    
    // Cleanup interval and event listener on unmount
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const unreadCount = notes.length;

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      // remove the notification from the visible list so it goes away
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {}
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          // fetch notifications when opening the dropdown
          if (next) fetchNotes();
        }}
        className="relative p-2 rounded-full hover:bg-white/10 transition"
        title="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6V11a6 6 0 10-12 0v3.6c0 .538-.214 1.055-.595 1.414L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="px-4 py-2 border-b text-sm font-semibold flex justify-between items-center">
            <span>Notifications</span>
            {loading && <span className="text-xs text-gray-500">Refreshing...</span>}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notes.length === 0 && !loading && (
              <div className="px-4 py-3 text-sm text-gray-600">No notifications</div>
            )}
            {notes.map((n) => (
              <div
                key={n._id}
                onClick={() => markRead(n._id)}
                className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer flex justify-between items-start`}
              >
                <div>
                  <div className={`text-sm text-gray-900 font-medium`}>{n.message}</div>
                  <div className="text-xs text-gray-500 mt-1">{timeAgo(n.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-3 py-2 text-right">
            <button
              onClick={async () => {
                try {
                  // mark all read on server
                  await Promise.all(notes.map(n => API.put(`/notifications/${n._id}/read`)));
                } catch (err) {}
                // remove all from visible list
                setNotes([]);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Mark all read
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;

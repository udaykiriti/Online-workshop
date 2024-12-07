import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css"; 
import "./AdminDashboard.css";
import "./buttons.css";
import profileIcon from "./profile-icon.jpg";
import { DeleteOutlined } from '@ant-design/icons';
import { jsPDF } from "jspdf";
import "jspdf-autotable"; // For the autoTable plugin
import * as XLSX from "xlsx"; // For Excel export

const ViewWorkshops = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [workshops, setWorkshops] = useState([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }

    fetch("https://onlineworkshop-server-production.up.railway.app/api/workshops")
      .then((response) => response.json())
      .then((data) => {
        setWorkshops(data);
      })
      .catch((error) => {
        console.error("Error fetching workshops:", error);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const handleUpdateWorkshop = (workshop) => {
    setSelectedWorkshop(workshop);
    setModalOpen(true);
  };

  const handleDeleteWorkshop = (id) => {
    if (window.confirm("Are you sure you want to delete this workshop?")) {
      fetch(`https://onlineworkshop-server-production.up.railway.app/api/workshops/${id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.ok) {
            setWorkshops(workshops.filter((workshop) => workshop.id !== id));
            toast.success("Workshop deleted successfully."); 
          } else {
            console.error("Failed to delete workshop");
            toast.error("Failed to delete workshop."); 
          }
        })
        .catch((error) => {
          console.error("Error deleting workshop:", error);
          toast.error("Error deleting workshop."); 
        });
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedWorkshop(null);
    setFile(null); 
  };

  const handleUpdate = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", selectedWorkshop.name);
    formData.append("date", selectedWorkshop.date);
    formData.append("time", selectedWorkshop.time);
    formData.append("meetingLink", selectedWorkshop.meetingLink);
    formData.append("description", selectedWorkshop.description);
    formData.append("instructor", selectedWorkshop.instructor);
    if (file) {
      formData.append("material", file);
    }

    fetch(`https://onlineworkshop-server-production.up.railway.app/api/workshops/${selectedWorkshop.id}`, {
      method: "PUT",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          return response.json(); 
        } else {
          throw new Error("Failed to update workshop");
        }
      })
      .then((updatedWorkshop) => {
        setWorkshops(
          workshops.map((workshop) =>
            workshop.id === updatedWorkshop.id ? updatedWorkshop : workshop
          )
        );
        handleModalClose();
        toast.success("Workshop updated successfully."); 
      })
      .catch((error) => {
        console.error("Error updating workshop:", error);
        toast.error("Error updating workshop."); 
      });
  };

  const filteredWorkshops = workshops.filter((workshop) =>
    workshop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to download workshops as PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Workshop Details", 14, 20);

    const tableData = workshops.map((workshop) => [
      workshop.name,
      workshop.date,
      workshop.time,
      workshop.meetingLink,
      workshop.description,
      workshop.instructor,
    ]);

    doc.autoTable({
      head: [["Name", "Date", "Time", "Meeting Link", "Description", "Instructor"]],
      body: tableData,
      startY: 30,
    });

    doc.save("workshops_details.pdf");
  };

  // Function to download workshops as Excel
  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(workshops);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workshops");
    XLSX.writeFile(wb, "workshops_details.xlsx");
  };

  return (
    <div className="dashboard1">
      <ToastContainer /> 
      <div className="sidebar">
        <h2 className="admin-title">Admin Dashboard</h2>
        <button onClick={() => navigate("/admin-dashboard")}>Home</button>
        <button onClick={() => navigate("/add-workshop")}>Add Workshop</button>
        <button onClick={() => navigate("/view-workshops")}>
          View Workshops
        </button>
        <button onClick={() => navigate("/manage-users")}>Manage Users</button>
        <button onClick={() => navigate("/faculty-management")}>
          Faculty Management
        </button>
        <button onClick={() => navigate("/admin-attendance")}>
          Admin Attendance
        </button>
        <button onClick={() => navigate("/settings")}>Profile</button>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Welcome, {username || "Admin User"}!</h2>
          <div className="profile">
            <img src={profileIcon} alt="Profile" className="profile-icon" />
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <h3>View Workshops</h3>
        
        <input
          type="text"
          placeholder="Search workshops..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <div className="download-buttons">
          <button onClick={downloadPDF} className="download-btn">Download as PDF</button>
          <button onClick={downloadExcel} className="download-btn">Download as Excel</button>
        </div>

        {filteredWorkshops.length > 0 ? (
          <table className="workshops-table">
            <thead>
              <tr>
                <th>Sno</th>
                <th>Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Meeting Link</th>
                <th>Description</th>
                <th>Instructor</th>
                <th>Material</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkshops.map((workshop,index) => (
                <tr key={workshop.id}>
                  <td>{index+1}</td>
                  <td>{workshop.name}</td>
                  <td>{workshop.date}</td>
                  <td>{workshop.time}</td>
                  <td>{workshop.meetingLink}</td>
                  <td>{workshop.description}</td>
                  <td>{workshop.instructor}</td>
                  <td>
                    <a
                      href={`http://localhost:8080/api/workshops/materials/${workshop.material}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Material
                    </a>
                  </td>
                  <td>
                    <button
                      className="update-btn"
                      onClick={() => handleUpdateWorkshop(workshop)}
                    >
                      Update
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteWorkshop(workshop.id)}
                    >
                          <DeleteOutlined style={{ fontSize: '20px', color: 'white' }} title="Delete" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No workshops available.</p>
        )}
      </div>

      {modalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleModalClose}>
              &times;
            </span>
            <h2>Update Workshop</h2>
            <form onSubmit={handleUpdate}>
              <div>
                <label>Name:</label>
                <input
                  type="text"
                  value={selectedWorkshop?.name || ""}
                  onChange={(e) =>
                    setSelectedWorkshop({
                      ...selectedWorkshop,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label>Date:</label>
                <input
                  type="date"
                  value={selectedWorkshop?.date || ""}
                  onChange={(e) =>
                    setSelectedWorkshop({
                      ...selectedWorkshop,
                      date: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label>Time:</label>
                <input
                  type="time"
                  value={selectedWorkshop?.time || ""}
                  onChange={(e) =>
                    setSelectedWorkshop({
                      ...selectedWorkshop,
                      time: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label>Meeting Link:</label>
                <input
                  type="text"
                  value={selectedWorkshop?.meetingLink || ""}
                  onChange={(e) =>
                    setSelectedWorkshop({
                      ...selectedWorkshop,
                      meetingLink: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label>Description:</label>
                <textarea
                  value={selectedWorkshop?.description || ""}
                  onChange={(e) =>
                    setSelectedWorkshop({
                      ...selectedWorkshop,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label>Instructor:</label>
                <input
                  type="text"
                  value={selectedWorkshop?.instructor || ""}
                  onChange={(e) =>
                    setSelectedWorkshop({
                      ...selectedWorkshop,
                      instructor: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label>Material (optional):</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>
              <button type="submit" className="update-confirm-btn">
                Update Workshop
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewWorkshops;

import React, { useState, useEffect } from "react";
import { useUserStore } from "@_src/store/auth";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { toast } from "react-toastify";
import { LuPencil, LuBook } from "react-icons/lu";
import { MdDelete } from "react-icons/md";
import dayjs from "dayjs";
import {
  useGetAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  useGetAnnouncementsByEvent,
} from "@_src/services/announcement";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { useLocation } from "react-router-dom";

export const Announcement = () => {
  const location = useLocation();
  const { event_id } = location.state || {};

  const { token, user } = useUserStore((s) => ({
    token: s.token,
    user: s.user,
  }));

  const decryptedToken = token && DecryptString(token);
  const decryptedUser = user && DecryptUser(user);
  const currentRoleId = decryptedUser?.role_id;

  const [announcements, setAnnouncements] = useState([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
  });
  const [loading, setLoading] = useState(false);

  // Fetch announcements (filtered by event if provided)
  const {
    data: announcementsData,
    refetch,
    isLoading,
  } = event_id
    ? useGetAnnouncementsByEvent(decryptedToken, event_id)
    : useGetAnnouncements(decryptedToken);

  useEffect(() => {
    if (announcementsData?.data) {
      console.log("Fetched announcements:", announcementsData.data);
      setAnnouncements(announcementsData.data);
    } else {
      console.log("No announcements fetched or empty data");
    }
  }, [announcementsData]);

  const openDialog = (announcement = null) => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        body: announcement.body,
      });
      setSelectedAnnouncement(announcement);
    } else {
      setFormData({ title: "", body: "" });
      setSelectedAnnouncement(null);
    }
    setDialogVisible(true);
  };

  const openViewDialog = (announcement) => {
    setSelectedAnnouncement(announcement);
    setViewDialog(true);
  };

  const openDeleteDialog = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      if (selectedAnnouncement) {
        // Update existing announcement
        await updateAnnouncement({
          token: decryptedToken,
          id: selectedAnnouncement.id,
          data: formData,
        });
        toast.success("Announcement updated successfully");
      } else {
        // Create new announcement — include event_id if available
        const newData = {
          ...formData,
          ...(event_id ? { event_id } : {}),
        };
        await createAnnouncement({ token: decryptedToken, formData: newData });
        toast.success("Announcement created successfully");
      }

      // Wait for refetch to update data before closing dialog
      await refetch();
      setDialogVisible(false);
      setFormData({ title: "", body: "" });
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast.error(error?.response?.data?.message || "Error saving announcement");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;
    try {
      await deleteAnnouncement({
        token: decryptedToken,
        id: selectedAnnouncement.id,
      });
      toast.success("Announcement deleted successfully");
      setDeleteDialog(false);
      await refetch();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete announcement");
    }
  };

  // Table Columns
  const titleTemplate = (rowData) => rowData.title;
  const bodyTemplate = (rowData) =>
    rowData.body?.length > 50
      ? rowData.body.substring(0, 50) + "..."
      : rowData.body;
  const dateTemplate = (rowData) =>
    dayjs(rowData.created_at).format("MMM D, YYYY h:mm A");

  const actionTemplate = (rowData) => (
    <div className="flex items-center justify-start w-full h-full gap-4">
      {/* View */}
      <button
        onClick={() => openViewDialog(rowData)}
        className="text-blue-600 hover:text-blue-800 relative group flex items-center justify-start"
      >
        <LuBook size={26} />
        <span className="absolute -top-8 left-0 scale-0 group-hover:scale-100 transition-transform bg-gray-700 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
          View
        </span>
      </button>

      {/* Edit (Admin only) */}
      {[1, 9, 10, 11].includes(currentRoleId) && (
        <button
          onClick={() => openDialog(rowData)}
          className="text-yellow-500 hover:text-yellow-600 relative group flex items-center justify-start"
        >
          <LuPencil size={26} />
          <span className="absolute -top-8 left-0 scale-0 group-hover:scale-100 transition-transform bg-gray-700 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
            Edit
          </span>
        </button>
      )}

      {/* Delete (Admin only) */}
      {[1, 9, 10, 11].includes(currentRoleId) && (
        <button
          onClick={() => openDeleteDialog(rowData)}
          className="text-red-600 hover:text-red-800 relative group flex items-center justify-start"
        >
          <MdDelete size={26} />
          <span className="absolute -top-8 left-0 scale-0 group-hover:scale-100 transition-transform bg-gray-700 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
            Delete
          </span>
        </button>
      )}
    </div>
  );

  return (
    <div className="announcement-page min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem] px-4">
      <h1 className="text-2xl font-semibold mb-4">Announcements</h1>

      {/* Create button for Admins only */}
      {[1, 9, 10, 11].includes(currentRoleId) && (
        <Button
          label="Create Announcement"
          className="bg-[#2211cc] text-white font-bold rounded-lg px-4 py-2 mb-6"
          onClick={() => openDialog()}
        />
      )}

      <div className="w-full max-w-6xl">
        <DataTable
          value={announcements}
          dataKey="id"
          responsiveLayout="scroll"
          emptyMessage={isLoading ? "Loading..." : "No announcements found."}
          loading={isLoading}
        >
          <Column field="title" header="Title" body={titleTemplate} />
          <Column header="Date Posted" body={dateTemplate} />
          <Column header="Actions" body={actionTemplate} style={{ width: "250px" }} />
        </DataTable>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        header={selectedAnnouncement ? "Edit Announcement" : "Create Announcement"}
        visible={dialogVisible}
        style={{ width: "500px" }}
        onHide={() => setDialogVisible(false)}
      >
        <div className="p-fluid space-y-4">
          <div className="field">
            <label htmlFor="title">Title *</label>
            <InputText
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter announcement title"
            />
          </div>
          <div className="field">
            <label htmlFor="body">Body *</label>
            <InputTextarea
              id="body"
              value={formData.body}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, body: e.target.value }))
              }
              rows={4}
              placeholder="Write your announcement..."
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              label="Cancel"
              className="p-button-text"
              onClick={() => setDialogVisible(false)}
            />
            <Button
              label={selectedAnnouncement ? "Update" : "Create"}
              loading={loading}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        header="Announcement Details"
        visible={viewDialog}
        style={{ width: "500px" }}
        onHide={() => setViewDialog(false)}
      >
        {selectedAnnouncement ? (
          <>
            <h2 className="text-xl font-semibold mb-2">{selectedAnnouncement.title}</h2>
            <p className="whitespace-pre-wrap">{selectedAnnouncement.body}</p>
            <p className="mt-4 text-sm text-gray-500">
              Posted:{" "}
              {dayjs(selectedAnnouncement.created_at).format("MMM D, YYYY h:mm A")}
            </p>
          </>
        ) : (
          <p>No announcement selected.</p>
        )}
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        header="Confirm Delete"
        visible={deleteDialog}
        style={{ width: "400px" }}
        onHide={() => setDeleteDialog(false)}
      >
        <div className="confirmation-content">
          <p>
            Are you sure you want to delete the announcement "
            {selectedAnnouncement?.title}"?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              label="Cancel"
              className="p-button-text"
              onClick={() => setDeleteDialog(false)}
            />
            <Button
              label="Delete"
              className="p-button-danger"
              onClick={handleDelete}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

import React, { useState, useEffect } from "react"; 
import { useLocation } from "react-router-dom";
import { useUserStore } from "@_src/store/auth";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { FileUpload } from "primereact/fileupload";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { toast } from "react-toastify";
import { LuEye, LuBook, LuPencil  } from "react-icons/lu";
import { MdDelete } from "react-icons/md";
import {
  useGetAttachments,
  createAttachment,
  updateAttachmentRemarks,
  deleteAttachment,
} from "@_src/services/attachment";
import dayjs from "dayjs";

export const UploadAttachment = () => {
  const location = useLocation();
  const { event_id, event_data } = location.state || {};
  const { token, user } = useUserStore((s) => ({ token: s.token, user: s.user }));

  const decryptedToken = token && DecryptString(token);
  const decryptedUser = user && DecryptUser(user);
  const currentUserId = decryptedUser?.id;
  const currentRoleId = decryptedUser?.role_id;

  const isCreator = event_data?.user_id === decryptedUser?.id;

  const [attachments, setAttachments] = useState([]);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [remarksDialog, setRemarksDialog] = useState(false);
  const [viewRemarksDialog, setViewRemarksDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    file: null,
    remarks: "",
  });

  // Fetch attachments
  const { data: attachmentsData, refetch, isLoading } = useGetAttachments(
    decryptedToken,
    event_id
  );

  useEffect(() => {
    if (attachmentsData?.data) {
      setAttachments(attachmentsData.data);
    }
  }, [attachmentsData]);

  const handleFileSelect = (e) => {
    const file = e.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFormData((prev) => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!formData.name || !formData.file) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploadLoading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("event_id", event_id);
      uploadFormData.append("name", formData.name);
      uploadFormData.append("file", formData.file);

      await createAttachment({ token: decryptedToken, formData: uploadFormData });
      toast.success("Attachment uploaded successfully");
      setUploadDialog(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to upload attachment");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAddRemarks = async () => {
    const remarksText = (formData.remarks || "").trim();
    if (!selectedAttachment || !remarksText) {
      toast.error("Remarks cannot be empty");
      return;
    }

    try {
      const fullName = `${decryptedUser.firstname} ${decryptedUser.lastname}`;
      const newRemark = `${remarksText}\n[remarks by: ${fullName}]`;

      await updateAttachmentRemarks({
        token: decryptedToken,
        id: selectedAttachment.id,
        remarks: newRemark,
      });

      toast.success("Remark added successfully");
      setRemarksDialog(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add remark");
    }
  };

  const handleDelete = async () => {
    if (!selectedAttachment) return;
    try {
      await deleteAttachment({ token: decryptedToken, id: selectedAttachment.id });
      toast.success("Attachment deleted successfully");
      setDeleteDialog(false);
      setSelectedAttachment(null);
      refetch();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete attachment");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", file: null, remarks: "" });
    setSelectedAttachment(null);
  };

  const openUploadDialog = () => {
    resetForm();
    setUploadDialog(true);
  };

  const openRemarksDialog = (attachment) => {
    setSelectedAttachment(attachment);
    setFormData((prev) => ({ ...prev, remarks: "" })); // always empty
    setRemarksDialog(true);
  };

  const openViewRemarksDialog = (attachment) => {
    setSelectedAttachment(attachment);
    setViewRemarksDialog(true);
  };

  const openDeleteDialog = (attachment) => {
    setSelectedAttachment(attachment);
    setDeleteDialog(true);
  };

  const nameTemplate = (rowData) => rowData.name;

  const dateTemplate = (rowData) =>
    dayjs(rowData.created_at).format("MMM D, YYYY h:mm A");

  const fileTemplate = (rowData) => (
    <div className="flex items-center justify-start w-full h-full">
      <button
        onClick={() => window.open(rowData.file, "_blank")}
        className="text-blue-600 hover:text-blue-800 relative group flex items-center justify-start"
      >
        <LuEye size={30} />
        <span className="absolute -top-8 left-0 scale-0 group-hover:scale-100 transition-transform bg-gray-700 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
          View
        </span>
      </button>
    </div>
  );

  const actionTemplate = (rowData) => (
  <div className="flex items-center justify-start w-full h-full gap-4">
    {/* View Remarks */}
    <button
      onClick={() => openViewRemarksDialog(rowData)}
      className="text-blue-600 hover:text-blue-800 relative group flex items-center justify-start"
    >
      <LuBook size={26} />
      <span className="absolute -top-8 left-0 scale-0 group-hover:scale-100 transition-transform bg-gray-700 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
        View Remarks
      </span>
    </button>

    {/* Add Remark */}
    {([1, 9, 10, 11].includes(currentRoleId)) &&  (
      <button
        onClick={() => openRemarksDialog(rowData)}
        className="text-yellow-500 hover:text-yellow-600 relative group flex items-center justify-start"
      >
        <LuPencil size={26} />
        <span className="absolute -top-8 left-0 scale-0 group-hover:scale-100 transition-transform bg-gray-700 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
          Add Remark
        </span>
      </button>
    )}

    {/* Delete (only event creator) */}
    {isCreator && (
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
    <div className="upload-attachment min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem] px-4">
      <h1 className="text-2xl font-semibold mb-4">Event Attachments</h1>

      {/* Only creator can see Upload button */}
      {isCreator && (
        <Button
          label="Upload Attachment"
          className="bg-[#2211cc] text-white font-bold rounded-lg px-4 py-2 mb-6"
          onClick={openUploadDialog}
        />
      )}

      <div className="w-full max-w-6xl">
        <DataTable
          value={attachments}
          dataKey="id"
          responsiveLayout="scroll"
          emptyMessage={isLoading ? "Loading..." : "No attachments found."}
          loading={isLoading}
        >
          <Column field="name" header="Attachment Name" body={nameTemplate} />
          <Column header="File" body={fileTemplate} style={{ textAlign: "left" }} />
          <Column header="Date Uploaded" body={dateTemplate} />
          <Column header="Actions" body={actionTemplate} style={{ width: "300px", textAlign: "left" }} />
        </DataTable>
      </div>

      {/* Upload Dialog */}
      <Dialog
        header="Upload Attachment"
        visible={uploadDialog}
        style={{ width: "500px" }}
        onHide={() => setUploadDialog(false)}
      >
        <div className="p-fluid space-y-4">
          <div className="field">
            <label htmlFor="name">Attachment Name *</label>
            <InputText
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter attachment name"
            />
          </div>
          <div className="field">
            <label htmlFor="file">PDF File * (Max: 10MB)</label>
            <FileUpload
              mode="basic"
              name="file"
              accept=".pdf"
              maxFileSize={10000000}
              chooseLabel="Choose PDF File"
              onSelect={handleFileSelect}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button label="Cancel" className="p-button-text" onClick={() => setUploadDialog(false)} />
            <Button label="Upload" loading={uploadLoading} onClick={handleUpload} disabled={!formData.name || !formData.file} />
          </div>
        </div>
      </Dialog>

      {/* Add Remarks Dialog */}
      {[1, 9, 10, 11].includes(currentRoleId) && (
        <Dialog
          header="Add Remark"
          visible={remarksDialog}
          style={{ width: "400px" }}
          onHide={() => setRemarksDialog(false)}
        >
          <div className="p-fluid">
            <div className="field">
              <label htmlFor="remarks">Remark</label>
              <InputTextarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                rows={3}
                placeholder="Enter your remark"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button label="Cancel" className="p-button-text" onClick={() => setRemarksDialog(false)} />
              <Button label="Add Remark" onClick={handleAddRemarks} disabled={!(formData.remarks || "").trim()} />
            </div>
          </div>
        </Dialog>
      )}

      {/* View Remarks Dialog */}
      <Dialog
        header="View Remarks"
        visible={viewRemarksDialog}
        style={{ width: "400px" }}
        onHide={() => setViewRemarksDialog(false)}
      >
        <p>{selectedAttachment?.remarks || "No remarks available."}</p>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        header="Confirm Delete"
        visible={deleteDialog}
        style={{ width: "400px" }}
        onHide={() => setDeleteDialog(false)}
      >
        <div className="confirmation-content">
          <p>Are you sure you want to delete the attachment "{selectedAttachment?.name}"?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button label="Cancel" className="p-button-text" onClick={() => setDeleteDialog(false)} />
            <Button label="Delete" className="p-button-danger" onClick={handleDelete} />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

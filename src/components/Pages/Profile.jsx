import React, { useState, useMemo } from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useUserStore } from "@_src/store/auth";
import { DecryptUser, DecryptString } from "@_src/utils/helpers";
import { CgProfile } from "react-icons/cg";
import { useForm } from "react-hook-form";
import { getDepartments } from "@_src/services/department";
import { getPrograms } from "@_src/services/program";
import { getUsers } from "@_src/services/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile, assignOfficerRole, removeOfficerRole } from "@_src/services/profile";
import { toast } from "react-toastify"
import _ from "lodash";

export const Profile = () => {
  const queryClient = useQueryClient();
  const { user, token } = useUserStore((s) => ({
    user: s.user,
    token: s.token,
  }));
  const decryptedUser = token ? DecryptUser(user) : null;
  const decryptedToken = token && DecryptString(token);

  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showOfficerDialog, setShowOfficerDialog] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [officerToRemove, setOfficerToRemove] = useState(null);

  // ✅ Fetch dropdown data
  const { data: departmentData } = getDepartments();
  const { data: programData } = getPrograms();
  const { data: userData, refetch: refetchUserData } = getUsers({ token: decryptedToken });
  const { refetch: refetchUsers } = getUsers({ token: decryptedToken });

  const isAuthorizedUser = [1, 9, 10, 11].includes(decryptedUser?.role_id);
  const isCurrentUserOfficer = decryptedUser?.is_officer === true || decryptedUser?.is_officer === 1;

  const { handleSubmit, reset } = useForm();

const { mutate: handleUpdateProfile, isLoading: updateProfileLoading } = useMutation({
  mutationFn: updateProfile,
  onSuccess: (data, variables) => {
    // Use the EXACT same pattern that works for officers
    refetchUsers(); // This refreshes the data immediately
    
    toast(data?.message, {type: "success"})
    setShowUpdateDialog(false);
    reset();
    setImageFile(null);
    setPreview(null);
  },
});

  // Update both mutations to use refetch
  const { mutate: handleRemoveOfficer, isLoading: removeOfficerLoading } = useMutation({
    mutationFn: removeOfficerRole,
    onSuccess: (data) => {
      // Force refetch of users data
      refetchUsers();
      toast(data?.message, { type: "success" });
    },
    onError: (err) => {
      console.log("@RemoveOfficerError", err);
      toast("Error removing officer role", { type: "error" });
    },
  });

  const { mutate: handleAssignOfficer, isLoading: assignOfficerLoading } = useMutation({
    mutationFn: assignOfficerRole,
    onSuccess: (data) => {
      // Force refetch of users data
      refetchUsers();
      toast(data?.message, { type: "success" });
      setShowOfficerDialog(false);
      setSelectedOfficer(null);
      setSearchQuery("");
    },
    onError: (err) => {
      console.log("@OfficerError", err);
      toast("Error assigning officer role", { type: "error" });
    },
  });

  // Update the remove officer handler
  const handleRemoveOfficerClick = (officerId, officerName) => {
    setOfficerToRemove({ id: officerId, name: officerName });
    setShowRemoveDialog(true);
  };

  // Confirm remove officer
  const confirmRemoveOfficer = () => {
    if (officerToRemove) {
      const payload = {
        token: decryptedToken,
        user_id: officerToRemove.id
      };
      
      handleRemoveOfficer(payload);
      setShowRemoveDialog(false);
      setOfficerToRemove(null);
    }
  };

  // Update the assignedOfficers to be more flexible
  const assignedOfficers = useMemo(() => {
    if (!userData?.data || !decryptedUser) return [];
    
    const officers = _.filter(
      userData.data, 
      (user) => {
        const isOfficer = user.is_officer === true || user.is_officer === 1;
        const sameRole = user.role_id === decryptedUser.role_id;
        
        // If user is dean (role_id 9), only show officers from same department
        if (decryptedUser?.role_id === 9) {
          return isOfficer && sameRole && user.department_id === decryptedUser.department_id;
        }
        
        // For other authorized roles (1, 10, 11), show all officers with same role
        return isOfficer && sameRole;
      }
    );
    
    return officers;
  }, [userData, decryptedUser]);

  // Filter faculty based on search query and department (for deans)
  const filteredFaculty = useMemo(() => {
    if (!userData?.data) return [];
    
    const faculty = _.filter(
      userData.data, 
      (user) => {
        // Base filter: exclude current user and only show role_id 4 (faculty)
        const isFaculty = user.id !== decryptedUser?.id && [4].includes(user.role_id);
        
        // If user is dean (role_id 9), filter by same department
        if (decryptedUser?.role_id === 9) {
          return isFaculty && user.department_id === decryptedUser.department_id;
        }
        
        // For other authorized roles (1, 10, 11), show all faculty
        return isFaculty;
      }
    );

    if (!searchQuery) return []; // Return empty array when no search query

    const query = searchQuery.toLowerCase();
    return faculty.filter(user => 
      user.firstname?.toLowerCase().includes(query) ||
      user.lastname?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  }, [userData, searchQuery, decryptedUser]);

  // Get department name
  const departmentName = useMemo(() => {
    if (!departmentData?.data || !decryptedUser?.department_id) return "N/A";
    const department = departmentData.data.find(dept => dept.id === decryptedUser.department_id);
    return department?.name || "N/A";
  }, [departmentData, decryptedUser]);

  // Get program name
  const programName = useMemo(() => {
    if (!programData?.data || !decryptedUser?.program_id) return "N/A";
    const program = programData.data.find(prog => prog.id === decryptedUser.program_id);
    return program?.name || "N/A";
  }, [programData, decryptedUser]);

  // ✅ Handle e-signature update
  const handleUpdate = (data) => {
    const payload = {
      token: decryptedToken,
      user: decryptedUser?.id,
      file: imageFile,
    }

    handleUpdateProfile(payload);
  };

  const handleAssignOfficerSubmit = () => {
    if (!selectedOfficer) {
      toast("Please select a faculty member", { type: "warning" });
      return;
    }

    const payload = {
      token: decryptedToken,
      officer_user_id: selectedOfficer.id,
      role_id: decryptedUser?.role_id // Use current user's role_id
    };

    handleAssignOfficer(payload);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      toast("Please select a valid image file (JPG, PNG, etc.)", { type: "warning" });
    }
  };

  const updateDialogFooter = (
    <div className="flex justify-end gap-2">
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={() => {
          setShowUpdateDialog(false);
          reset();
          setImageFile(null);
          setPreview(null);
        }}  
        className="p-button-text"
      />
      <Button
        disabled={updateProfileLoading || !imageFile}
        type="submit"
        label={`${updateProfileLoading ? 'Updating e-signature...' : 'Update E-Signature'}`}
        icon="pi pi-check"
        form="update-user-form"
      />
    </div>
  );

  const officerDialogFooter = (
    <div className="flex justify-end gap-2">
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={() => {
          setShowOfficerDialog(false);
          setSelectedOfficer(null);
          setSearchQuery("");
        }}
        className="p-button-text"
      />
      <Button
        disabled={assignOfficerLoading}
        onClick={handleAssignOfficerSubmit}
        label={`${assignOfficerLoading ? 'Assigning Officer...' : 'Assign as Officer'}`}
        icon="pi pi-check"
      />
    </div>
  );

  // Remove Dialog Footer
  const removeDialogFooter = (
    <div className="flex justify-end gap-2">
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={() => {
          setShowRemoveDialog(false);
          setOfficerToRemove(null);
        }}
        className="p-button-text"
      />
      <Button
        label="Yes, Remove"
        icon="pi pi-check"
        onClick={confirmRemoveOfficer}
        className="p-button-danger"
      />
    </div>
  );
  
  if (!decryptedUser) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 text-lg">
        Loading profile...
      </div>
    );
  }

  const { firstname, lastname, middlename, contact, email, organizations, school_id, esign } =
    decryptedUser;

    const getRoleName = (roleId) => {
      const roleNames = {
        1: "Comex",
        9: "Dean", 
        10: "Academic Service Director",
        11: "Academic Director"
      };
      return roleNames[roleId] || "Administrator";
    };

  return (
    <div className="profile-detail-main min-h-screen bg-gray-50 w-full flex flex-col items-center sm:pl-[200px] py-20 px-6">
      <Card
        className="w-full max-w-2xl shadow-lg rounded-2xl"
        title="User Profile"
      >
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <CgProfile width={100} height={100} className="text-[100px] text-gray-500" />
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <h2 className="text-2xl font-semibold text-gray-800">
              {firstname} {middlename ?? ""} {lastname}
            </h2>
            <p className="text-gray-600">{email}</p>
            <p className="text-gray-500">📞 {contact}</p>
          </div>
        </div>

        <hr className="my-6" />

        {/* Academic Information */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Academic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">School</p>
              <p className="font-medium">{departmentName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-medium">{programName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">School ID</p>
              <p className="font-medium">{school_id || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* E-Signature Display */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">E-Signature</h3>
          {updateProfileLoading ? (
            <div className="flex items-center gap-4">
              <div className="w-32 h-16 bg-gray-200 animate-pulse rounded border border-gray-300 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Updating...</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Updating e-signature...</p>
              </div>
            </div>
          ) : esign ? (
            <div className="flex items-center gap-4">
              <img 
                src={esign} 
                alt="E-Signature"
                className="w-32 h-16 object-contain border border-gray-300 rounded"
              />
              <div>
                <p className="text-sm text-gray-600">Current e-signature</p>
                <p className="text-xs text-gray-500">Click "Update E-Signature" to change</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-32 h-16 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                <span className="text-gray-500 text-sm">No e-signature</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">No e-signature set</p>
                <p className="text-xs text-gray-500">Click "Update E-Signature" to add one</p>
              </div>
            </div>
          )}
        </div>

        {/* Organizations */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Organizations</h3>
          {organizations && organizations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {organizations.map((org) => (
                <Tag key={org.id} value={org.name} severity="info" className="px-3 py-1 text-sm" />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No organization data available.</p>
          )}
        </div>

        {isCurrentUserOfficer && (
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">
              <i className="pi pi-info-circle mr-2"></i>
              Officer InCharge By {getRoleName(decryptedUser.role_id)}
            </p>
          </div>
        )}
        {isAuthorizedUser && !isCurrentUserOfficer && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Assigned Officers</h3>
            {assignedOfficers && assignedOfficers.length > 0 ? (
              <div className="flex flex-col gap-2">
                {assignedOfficers.map((officer) => (
                  <div key={officer.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <span className="font-medium">
                        {officer.firstname} {officer.lastname}
                      </span>
                    </div>
                    <Button
                      icon="pi pi-times"
                      className="p-button-rounded p-button-text text-red-500 hover:text-red-700 p-button-sm"
                      onClick={() => handleRemoveOfficerClick(officer.id, `${officer.firstname} ${officer.lastname}`)}
                      disabled={removeOfficerLoading}
                      tooltip="Remove officer designation"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No officers designated yet.</p>
            )}
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-4">
        <Button
          onClick={() => setShowUpdateDialog(true)}
          className="bg-[#2211cc] text-white px-6 py-3 font-medium rounded-lg hover:bg-[#1a0da3] transition-colors"
          label="Update E-Signature"
        />
        {isAuthorizedUser && assignedOfficers.length === 0 && !isCurrentUserOfficer && (
          <Button
            onClick={() => setShowOfficerDialog(true)}
            className="bg-[#11cc22] text-white px-6 py-3 font-medium rounded-lg hover:bg-[#0da31a] transition-colors"
            label="Assign Officer"
            icon="pi pi-user-plus"
          />
        )}
      </div>

      {/* ✅ Update E-Signature Modal */}
      <Dialog
        header="Update E-Signature"
        visible={showUpdateDialog}
        style={{ width: "50vw" }}
        footer={updateDialogFooter}
        onHide={() => {
          setShowUpdateDialog(false);
          reset();
          setImageFile(null);
          setPreview(null);
        }}
        draggable={false}
        resizable={false}
      >
        <form
          id="update-user-form"
          onSubmit={handleSubmit(handleUpdate)}
          className="p-fluid space-y-5"
        >
          {/* ✅ E-Signature Upload */}
          <div>
            <label className="font-semibold mb-2 block">E-Signature Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="border border-gray-300 p-2 rounded-lg w-full"
            />
            {preview && (
              <div className="mt-4 flex justify-center">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-full border border-gray-300"
                />
              </div>
            )}
            {!imageFile && (
              <small className="text-gray-500 block mt-2">
                Select an image file to update your e-signature
              </small>
            )}
          </div>
        </form>
      </Dialog>

    {/* ✅ Set Officer Modal */}
    <Dialog
      header="Assign Officer Role"
      visible={showOfficerDialog}
      style={{ width: "40vw" }}
      footer={officerDialogFooter}
      onHide={() => {
        setShowOfficerDialog(false);
        setSelectedOfficer(null);
        setSearchQuery("");
      }}
      draggable={false}
      resizable={false}
      >
      <div className="p-fluid space-y-5">
        {!selectedOfficer && (
          <div>
            <label className="font-semibold mb-2 block">Search Faculty</label>
            {decryptedUser?.role_id === 9 && (
              <small className="text-blue-600 block mb-2">
                ⓘ You can only select Faculty Member from your department
              </small>
            )}
            <InputText
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search faculty by name or email..."
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
        )}

        {/* Selected Officer Display */}
        {selectedOfficer && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Selected Officer:</h4>
            <div className="flex items-center gap-3">
              <CgProfile className="text-3xl text-blue-600" />
              <div>
                <p className="font-medium">
                  {selectedOfficer.firstname} {selectedOfficer.lastname}
                </p>
                <p className="text-sm text-blue-600">{selectedOfficer.email}</p>
              </div>
              <Button
                icon="pi pi-times"
                className="p-button-rounded p-button-text p-button-danger ml-auto"
                onClick={() => {
                  setSelectedOfficer(null);
                  setSearchQuery(""); // Reset search when changing selection
                }}
                tooltip="Change selection"
              />
            </div>
          </div>
        )}

        {/* Faculty List - Only show when searching and no officer selected */}
        {!selectedOfficer && searchQuery && (
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredFaculty.length > 0 ? (
              filteredFaculty.map((faculty) => (
                <div
                  key={faculty.id}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedOfficer(faculty)}
                >
                  <div className="flex items-center gap-3">
                    <CgProfile className="text-2xl text-gray-500" />
                    <div>
                      <p className="font-medium">
                        {faculty.firstname} {faculty.lastname}
                      </p>
                      <p className="text-sm text-gray-600">{faculty.email}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No faculty members found for "{searchQuery}"
              </div>
            )}
          </div>
        )}

        {/* Instructions - Only show when no officer and no search */}
        {!selectedOfficer && !searchQuery && (
          <small className="text-gray-500 block text-center">
            Start typing to search for faculty members
          </small>
        )}
      </div>
    </Dialog>

    <Dialog
      header="Confirm Removal"
      visible={showRemoveDialog}
      style={{ width: "400px" }}
      footer={removeDialogFooter}
      onHide={() => {
        setShowRemoveDialog(false);
        setOfficerToRemove(null);
      }}
      draggable={false}
      resizable={false}
    >
      <div className="flex items-center gap-3">
        <i className="pi pi-exclamation-triangle text-yellow-500 text-2xl" />
        <div>
          <p className="font-medium">Are you sure you want to remove this officer?</p>
          <p className="text-gray-600">
            {officerToRemove?.name} will no longer have officer privileges.
          </p>
        </div>
      </div>
    </Dialog>
    </div>
  );
};
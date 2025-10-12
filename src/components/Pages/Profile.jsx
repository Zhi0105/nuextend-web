import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { useUserStore } from "@_src/store/auth";
import { DecryptUser, DecryptString } from "@_src/utils/helpers";
import { CgProfile } from "react-icons/cg";
import { useForm, Controller, useWatch } from "react-hook-form";
import { getDepartments } from "@_src/services/department";
import { getPrograms } from "@_src/services/program";
import { getSkills } from "@_src/services/skills";
import { getUsers } from "@_src/services/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "@_src/services/profile";
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

  // ✅ Fetch dropdown data
  const { data: departmentData } = getDepartments();
  const { data: programData } = getPrograms();
  const { data: skillData } = getSkills();
  const { data: userData } = getUsers({ token: decryptedToken });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const { control, handleSubmit, watch, getValues, reset } = useForm({
    defaultValues: {
      officer: "",
      department: "",
      program: "",
      skills: [],
    },
  });

  const { mutate: handleUpdateProfile, isLoading: updateProfileLoading } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      console.log("payload_send", variables)
      toast(data?.message, {type: "success"})
      setShowUpdateDialog(false);
      reset();
    },
    onError: (err) => {
      console.log("@UPE", err)
    },
  });

  const filteredPrograms = useMemo(() => {
    const department = getValues("department");
    if (!programData?.data || !department) return [];
    return _.filter(programData.data, (p) => p.department_id === department.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programData, watch("department")]);

  const selectedUser = useWatch({ control, name: "user" });

  const formattedUser = useMemo(() => {
    if (!selectedUser) return null;
    return {
      ...selectedUser,
      department: selectedUser.department || "",
      program: selectedUser.program || "",
      skills: selectedUser.skills || [],
    };
  }, [selectedUser]);

  const prevUserRef = useRef(null);

  useEffect(() => {
    if (formattedUser && prevUserRef.current !== formattedUser.id) {
      reset({
        ...getValues(),
        ...formattedUser,
      });
      prevUserRef.current = formattedUser.id;
    }
  }, [formattedUser, reset, getValues]);

  // ✅ Handle submit
  const handleUpdate = (data) => {
    const payload = {
      token: decryptedToken,
      user: decryptedUser?.id,
      file: imageFile,
      role: decryptedUser?.role_id, 
      department: data?.department.id,
      program: data?.program.id,
      skills: _.get(data, 'skills', []).length >= 1  ? _.map(data?.skills, 'id') : [],
      officer: data?.officer.id
    }

    handleUpdateProfile(payload)
    
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


  const dialogFooter = (
    <div className="flex justify-end gap-2">
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={() => {
          setShowUpdateDialog(false);
          reset();
        }}
        className="p-button-text"
      />
      <Button
        disabled={updateProfileLoading}
        type="submit"
        label={`${updateProfileLoading ? 'Updating profile.....' : 'Update'}`}
        icon="pi pi-check"
        form="update-user-form"
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

  const { firstname, lastname, middlename, contact, email, organizations, skill } =
    decryptedUser;

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

        {/* Skills */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Skills</h3>
          {skill && skill.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skill.map((s) => (
                <Tag key={s.id} value={s.name} severity="success" className="px-3 py-1 text-sm" />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No skills listed.</p>
          )}
        </div>
      </Card>

      {/* Update Button */}
      <Button
        onClick={() => setShowUpdateDialog(true)}
        className="bg-[#2211cc] text-white px-6 py-3 font-medium rounded-lg hover:bg-[#1a0da3] transition-colors mt-4"
        label="Update User"
      />

      {/* ✅ Update Modal */}
      <Dialog
        header="Update User Information"
        visible={showUpdateDialog}
        style={{ width: "50vw" }}
        footer={dialogFooter}
        onHide={() => {
          setShowUpdateDialog(false);
          reset();
        }}
        draggable={false}
        resizable={false}
      >
        <form
          id="update-user-form"
          onSubmit={handleSubmit(handleUpdate)}
          className="p-fluid space-y-5"
        >
          {/* User Dropdown */}
          <div>
            <label className="font-semibold mb-2 block">Select faculty as officer</label>
            <Controller
              control={control}
              name="officer"
              rules={{ required: "Please select a user" }}
              render={({ field, fieldState }) => (
                <>
                  <Dropdown
                    {...field}
                    filter
                    // options={userData?.data || []}
                    options={_.filter(userData?.data, (user) => (user.id !== decryptedUser.id) && ([4].includes(user.role_id))) || []} 
                    
                    optionLabel="firstname"
                    placeholder="Select faculty to become officer (optional)"
                    itemTemplate={(option) => `${option.lastname}, ${option.firstname}`}
                    className="w-full border border-gray-300 rounded-lg"
                  />
                  {fieldState.error && (
                    <small className="text-red-500">{fieldState.error.message}</small>
                  )}
                </>
              )}
            />
          </div>

          {/* Department Dropdown */}
          <div>
            <label className="font-semibold mb-2 block">Department</label>
            <Controller
              control={control}
              name="department"
              rules={{ required: "Please select a department" }}
              render={({ field, fieldState }) => (
                <>
                  <Dropdown
                    {...field}
                    options={departmentData?.data || []}
                    optionLabel="name"
                    placeholder="Select Department"
                    className="w-full border border-gray-300 rounded-lg"
                  />
                  {fieldState.error && (
                    <small className="text-red-500">{fieldState.error.message}</small>
                  )}
                </>
              )}
            />
          </div>

          {/* Program Dropdown */}
          <div>
            <label className="font-semibold mb-2 block">Program</label>
            <Controller
              control={control}
              name="program"
              rules={{ required: "Please select a program" }}
              render={({ field, fieldState }) => (
                <>
                  <Dropdown
                    {...field}
                    options={filteredPrograms}
                    optionLabel="name"
                    placeholder="Select Program"
                    className="w-full border border-gray-300 rounded-lg"
                  />
                  {fieldState.error && (
                    <small className="text-red-500">{fieldState.error.message}</small>
                  )}
                </>
              )}
            />
          </div>

          {/* Skills MultiSelect */}
          <div>
            <label className="font-semibold mb-2 block">Skills</label>
            <Controller
              control={control}
              name="skills"
              rules={{ required: "Please select at least one skill" }}
              render={({ field, fieldState }) => (
                <>
                  <MultiSelect
                    {...field}
                    options={skillData?.data || []}
                    optionLabel="name"
                    display="chip"
                    placeholder="Select Skills"
                    maxSelectedLabels={3}
                    className="w-full border border-gray-300 rounded-lg"
                  />
                  {fieldState.error && (
                    <small className="text-red-500">{fieldState.error.message}</small>
                  )}
                </>
              )}
            />
          </div>

          {/* ✅ Image Upload */}
          <div>
            <label className="font-semibold mb-2 block">Profile Image</label>
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
          </div>
        </form>
      </Dialog>
    </div>
  );
};

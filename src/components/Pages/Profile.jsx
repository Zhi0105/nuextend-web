import React from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { useUserStore } from "@_src/store/auth";
import { DecryptUser } from "@_src/utils/helpers";
import { CgProfile } from "react-icons/cg";

export const Profile = () => {
  const { user, token } = useUserStore((s) => ({
    user: s.user,
    token: s.token,
  }));

  const decryptedUser = token ? DecryptUser(user) : null;

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
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6">
            <CgProfile
                width={100}
                height={100}
                className="text-[100px] text-gray-500"
            />
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
                <Tag
                  key={org.id}
                  value={org.name}
                  severity="info"
                  className="px-3 py-1 text-sm"
                />
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
                <Tag
                  key={s.id}
                  value={s.name}
                  severity="success"
                  className="px-3 py-1 text-sm"
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No skills listed.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

/* eslint-disable react-hooks/exhaustive-deps */
import _ from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LazyImage } from "@_src/components/Lazy/Lazy"

export const Certificate = () => {
  const { state, search } = useLocation();
  const navigate = useNavigate();
  const previewRefs = useRef([]);
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
  let certData = [];


  if (state?.people?.length) {
    certData = state.people.map(({ name, role }) => ({
      name,
      programTitle: state.title || "“Title of Program or Project”",
      date: state.date || state.implementDate || new Date().toISOString(),
      location: state.location || "Location of Implementation",
      role: role || "Role or Responsibility",
      term: state.term || "Term of Academic Year",
    }));
  } else if (search.includes("data=")) {
    try {
      const params = new URLSearchParams(search);
      const encoded = params.get("data");
      if (encoded) certData = JSON.parse(atob(decodeURIComponent(encoded)));
    } catch (err) {
      console.error("Failed to decode certificate data", err);
    }
  }

  if (!certData.length) {
    navigate("/");
    return;
  }

  setCertificates(certData);

  const timer = setTimeout(() => window.print(), 700);
  return () => clearTimeout(timer);
}, []);


  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formatCurrentDate = (date) =>
      new Date(date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      });

    console.log(_.filter(state?.users, user => _.includes([1, 10, 11, 12], user.role_id)))
    const filteredUsers = _.filter(state?.users, user => _.includes([1, 10, 11, 12], user.role_id))


  return (
    <div className="p-6 print:p-0 bg-gray-100 min-h-screen">
      {certificates.map((cert, index) => (
        <div
          key={index}
          ref={(el) => (previewRefs.current[index] = el)}
          className="relative w-[1280px] h-[900px] mx-auto mb-10 shadow-lg print:break-after-page bg-white"
          style={{
            backgroundImage: `url("/ComExCert.png")`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            pageBreakAfter: "always",
          }}
        >
          {/* Recipient Name */}
          <div
            className="absolute text-center font-bold text-3xl text-[#000]"
            style={{
              top: "330px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "80%",
            }}
          >
            <p className="capitalize">{cert.name}</p>
          </div>

          {/* Certificate Body */}
          <div
            className="absolute text-center text-black text-base leading-7"
            style={{
              top: "390px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "85%",
            }}
          >
            <p>
              in recognition for his/her active participation in the{" "}
              <strong>Community Extension Program or Project</strong> entitled:
            </p>
            <p className="italic font-semibold mt-2">
              {cert.programTitle}
            </p>
            <p className="mt-2">
              Implemented on{" "}
              <strong>{formatDate(cert.date)}</strong>, at{" "}
              <strong>{cert.location}</strong>. Issued this{" "}
              <strong>{formatCurrentDate(new Date())}</strong>,{" "}
              <strong>{cert.term}</strong>.
            </p>
            <p className="mt-2">
              Thank you very much for the immeasurably valuable work you have
              done as <strong>{cert.role}</strong>. Your dedication is essential
              to the mission and vision of the Community Extension Office.
            </p>
          </div>

          {/* Signatories */}
<div
  className="absolute text-sm text-center"
  style={{
    bottom: "110px",
    width: "100%",
  }}
>
  <div className="grid grid-cols-4 gap-4 w-[90%] mx-auto">
    {filteredUsers.map((user, i) => (
      <div key={i} className="flex flex-col items-center">
        {/* eSignature Image */}
        {user.esign && (

            <LazyImage 
            src={user.esign}
            alt="signature"
            width={1000}  /* Adjust width */
            height={1000} /* Adjust height */
            style={{
              margin: '20px 0px 0px 0px', /* top, right, bottom, left */
              objectFit: 'contain',
              display: 'block'
            }}
          />
        )}
        
        {/* User Name in ALL CAPS */}
        <p className="font-bold uppercase text-xs mb-1">
          {`${user.firstname || ''} ${user.middlename || ''} ${user.lastname || ''}`.trim().replace(/\s+/g, ' ')}
        </p>
        
        {/* Title based on role_id */}
        <div className="border-t border-black w-[80%] mx-auto mt-1"></div>
        <p className="text-xs mt-1">
          {user.role_id === 1 && "Community Extension Coordinator"}
          {user.role_id === 10 && "Academic Services Director"}
          {user.role_id === 11 && "Academic Director"}
          {user.role_id === 12 && "Executive Director"}
        </p>
      </div>
    ))}
  </div>

  <p className="text-xs mt-5 italic">
    <strong>ComEx CARES</strong> through the activities that adhere to
    the principles of{" "}
    <span className="text-red-600 font-semibold">
      Collaboration, Accountability, Relevance, Empowerment, and
      Sustainability.
    </span>
  </p>
</div>
        </div>
      ))}

      {/* Force landscape printing */}
      <style>
        {`
          @page {
            size: A4 landscape;
            margin: 0;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .certificate-bg {
              print-color-adjust: exact;
            }
          }
        `}
      </style>
    </div>
  );
};
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const Certificate = () => {
  const { state, search } = useLocation();
  const navigate = useNavigate();
  const previewRefs = useRef([]);
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    let certData = [];

    if (state?.names?.length) {
      certData = state.names.map((name) => ({
        name,
        programTitle: state.programTitle || "“Title of Program or Project”",
        date: state.date || state.implementDate || new Date().toISOString(),
        location: state.location || "Location of Implementation",
        role: state.role || "Role or Responsibility",
        term: state.term || "Term of Academic Year",
        hours: state.hours || "0.0 (Initiative)",
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

  return (
    <div className="p-6 print:p-0 bg-gray-100 min-h-screen">
      {certificates.map((cert, index) => (
        <div
          key={index}
          ref={(el) => (previewRefs.current[index] = el)}
          className="relative w-[1280px] h-[900px] mx-auto mb-10 shadow-lg print:break-after-page bg-white"
          style={{
            backgroundImage: `url("/cert.webp")`,
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
              <strong>{formatDate(new Date())}</strong>,{" "}
              <strong>{cert.term}</strong>.
            </p>
            <p className="mt-2">
              Thank you very much for the immeasurably valuable work you have
              done as <strong>{cert.role}</strong>. Your dedication is essential
              to the mission and vision of the Community Extension Office.
            </p>
            <p className="italic text-right text-sm mt-3 pr-10">
              Hours Rendered: {cert.hours}
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
              {[
                "Community Extension Coordinator",
                "Academic Services Director",
                "Academic Director",
                "Executive Director",
              ].map((title, i) => (
                <div key={i}>
                  <div className="border-t border-black w-[80%] mx-auto"></div>
                  <p>{title}</p>
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

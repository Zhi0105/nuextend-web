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

    // Extract from state or decode from query params
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

    const timer = setTimeout(() => {
      window.print();
    }, 600);
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
      <h2 className="text-2xl font-bold mb-4 hidden print:block text-center">
        NU Baliwag Community Extension Certificate
      </h2>

      {certificates.map((cert, index) => (
        <div key={index} className="mb-10 break-after-page print:break-after-page">
          <div
            ref={(el) => (previewRefs.current[index] = el)}
            className="relative w-[1200px] h-[850px] mx-auto bg-white shadow-xl"
            style={{
              backgroundImage: `url("/cert.webp")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Recipient Name */}
            <div
              className="absolute text-black text-2xl font-bold text-center"
              style={{
                top: "320px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "80%",
              }}
            >
              <h1 className="capitalize">{cert.name}</h1>
            </div>

            {/* Body Text */}
            <div
              className="absolute text-black text-base leading-7 text-center px-16"
              style={{
                top: "370px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "80%",
              }}
            >
              <p>
                in recognition for his/her active participation in the{" "}
                <strong>Community Extension Program or Project</strong> entitled:
              </p>
              <p className="font-semibold italic mt-2">
                {cert.programTitle}
              </p>
              <p className="mt-2">
                Implemented on <strong>{formatDate(cert.date)}</strong>, at{" "}
                <strong>{cert.location}</strong>. Issued this{" "}
                <strong>{formatDate(new Date())}</strong>,{" "}
                <strong>{cert.term}</strong>.
              </p>
              <p className="mt-2">
                Thank you very much for the immeasurably valuable work you have
                done as <strong>{cert.role}</strong>. Your dedication is
                essential to the mission and vision of the Community Extension
                Office.
              </p>
              <p className="text-right italic text-sm mt-3">
                Hours Rendered: {cert.hours}
              </p>
            </div>

            {/* Signatories */}
            <div
              className="absolute w-full text-sm text-center"
              style={{ bottom: "100px" }}
            >
              <div className="grid grid-cols-4 gap-6 w-[90%] mx-auto">
                <div>
                  <div className="border-t border-black w-[80%] mx-auto"></div>
                  <p>Community Extension Coordinator</p>
                </div>
                <div>
                  <div className="border-t border-black w-[80%] mx-auto"></div>
                  <p>Academic Services Director</p>
                </div>
                <div>
                  <div className="border-t border-black w-[80%] mx-auto"></div>
                  <p>Academic Director</p>
                </div>
                <div>
                  <div className="border-t border-black w-[80%] mx-auto"></div>
                  <p>Executive Director</p>
                </div>
              </div>

              <p className="text-xs mt-6 italic">
                <strong>ComEx CARES</strong> through the activities that adhere
                to the principles of{" "}
                <span className="text-red-600 font-semibold">
                  Collaboration, Accountability, Relevance, Empowerment, and
                  Sustainability.
                </span>
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
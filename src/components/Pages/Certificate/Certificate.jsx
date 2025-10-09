/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const Certificate = () => {
    const { state, search } = useLocation();
    const navigate = useNavigate();
    const previewRefs = useRef([]);
    const [names, setNames] = useState([]);

    useEffect(() => {
        let extractedNames = state?.names || [];

        if (!extractedNames.length && search.includes("data=")) {
            try {
                const params = new URLSearchParams(search);
                const encoded = params.get("data");
                if (encoded) {
                    const decoded = JSON.parse(atob(decodeURIComponent(encoded)));
                    extractedNames = decoded.names || [];
                }
            } catch (err) {
                console.error("Failed to decode certificate data", err);
            }
        }

        if (!extractedNames.length) {
            navigate("/");
            return;
        }

        setNames(extractedNames);

        const timer = setTimeout(() => {
            window.print();
        }, 500); // allow time for images to load

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="p-6 print:p-0">
            <h2 className="text-2xl font-bold mb-4 hidden print:block">
                Certificate Print Preview
            </h2>

            {names.map((name, index) => (
                <div
                    key={index}
                    className="mb-10 break-after-page print:break-after-page"
                >
                    <div
                        ref={(el) => (previewRefs.current[index] = el)}
                        className="relative w-[1200px] h-[850px] mx-auto bg-white shadow-xl certificate-bg"
                        style={{
                            backgroundImage: `url("/certificate.webp")`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    >
                        <div
                            className="absolute text-black text-2xl font-bold"
                            style={{
                                top: "320px",
                                left: "51%",
                                transform: "translateX(-50%)",
                            }}
                        >
                            <h1 className="capitalize">{name}</h1>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

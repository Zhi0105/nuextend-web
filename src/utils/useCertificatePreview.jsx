// hooks/useCertificatePreview.js
import { useNavigate } from "react-router-dom";

export const useCertificatePreview = () => {
    const navigate = useNavigate();

    const previewCertificates = (namesArray) => {
        navigate("/certificate-print", {
        state: { names: namesArray }
        });
    };

    return previewCertificates;
};
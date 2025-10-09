// hooks/useCertificatePreview.js
import { useNavigate } from "react-router-dom";

export const useCertificatePreview = () => {
  const navigate = useNavigate();

  const previewCertificates = (data) => {
    navigate("/certificate-print", { state: data });
  };

  return previewCertificates;
};
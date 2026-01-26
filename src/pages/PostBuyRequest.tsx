import React from "react";
import { useNavigate } from "react-router-dom";
import CreateBuyerRequest from "../components/CreateBuyerRequest";

const PostBuyRequest: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Show success and redirect to browse requests
    navigate("/request", {
      state: { message: "Buy request posted successfully!" },
    });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <CreateBuyerRequest onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default PostBuyRequest;

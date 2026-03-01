import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, API_ENDPOINTS } from "../config/api";
import { storeAuthSession } from "../utils/authSession";

const PhoneVerification: React.FC = () => {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (!phone) {
      alert("Please enter your phone number.");
      return;
    }

    try {
      setLoading(true);
      await apiRequest(API_ENDPOINTS.auth.resendVerification, {
        method: "POST",
        body: JSON.stringify({ phone }),
      });

      alert("Verification code sent to your phone.");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!phone || !code) {
      alert("Enter both phone and code.");
      return;
    }

    try {
      setLoading(true);

      const res: any = await apiRequest(API_ENDPOINTS.auth.verifyPhone, {
        method: "POST",
        body: JSON.stringify({ phone, code }),
      });

      if (res.success) {
        if (res.data?.token || res.data?.accessToken) {
          storeAuthSession({
            token: res.data?.token || res.data?.accessToken,
            refreshToken: res.data?.refreshToken,
            expiresIn: res.data?.expiresIn,
          });
        }
        if (res.data?.user) {
          localStorage.setItem("kodisha_user", JSON.stringify(res.data.user));
        }
        alert("Phone verified successfully.");
        navigate("/profile");
      } else {
        alert(res.message || "Verification failed.");
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          📲 Phone Verification
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2547XXXXXXXX"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            onClick={handleSendCode}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            {loading ? "Sending..." : "Send Verification Code"}
          </button>

          <hr className="my-4" />

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Enter Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            {loading ? "Verifying..." : "Verify Phone"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerification;

import React from 'react';

const WhatsAppFloatingButton: React.FC = () => {
  const whatsappGroupUrl = 'https://chat.whatsapp.com/HzCaV5YVz86CjwajiOHR5i';

  const handleClick = () => {
    window.open(whatsappGroupUrl, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 left-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center"
      title="Join our WhatsApp group"
      aria-label="Join WhatsApp group"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </button>
  );
};

export default WhatsAppFloatingButton;

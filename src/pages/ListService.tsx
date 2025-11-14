import React, { useState } from 'react';
import { useProperties } from '../contexts/PropertyContext';
import { ServiceFormData } from '../types/property';
import { Link } from 'react-router-dom';

const ListService: React.FC = () => {
  const { addService } = useProperties();
  const [formData, setFormData] = useState<ServiceFormData>({
    type: 'equipment',
    name: '',
    description: '',
    county: '',
    constituency: '',
    ward: '',
    contact: '',
    services: []
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Fix: Add type annotation to serviceOptions
  const serviceOptions: Record<'equipment' | 'agrovet' | 'professional_services', string[]> = {
    equipment: [
      'tractor hire', 'ploughing service', 'harvesting machine', 'transport trailer', 
      'irrigation system', 'spraying equipment', 'tiller', 'water pump'
    ],
    agrovet: [
      'fertilizers', 'seeds', 'pesticides', 'animal drugs', 'animal feeds', 
      'farm tools', 'vet services', 'vaccinations'
    ],
    professional_services: [
      'land survey', 'real estate agent', 'legal services', 'soil testing', 
      'agricultural consultation', 'title processing', 'boundary marking'
    ]
  };

  const typeLabels = {
    equipment: '🚜 Equipment',
    agrovet: '🏪 Agrovet', 
    professional_services: '👨‍💼 Professional Services'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addService({
      ...formData,
      services: selectedServices
    });
    
    alert('Service listed successfully! It will appear after verification.');
    
    // Reset form
    setFormData({
      type: 'equipment',
      name: '',
      description: '',
      county: '',
      constituency: '',
      ward: '',
      contact: '',
      services: []
    });
    setSelectedServices([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    if (e.target.name === 'type') {
      setSelectedServices([]);
    }
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const kenyaCounties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Machakos', 'Kajiado', 'Meru'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">List Equipment/Service</h1>
        <p className="text-gray-600">Offer farm equipment, agrovet products, or professional services to farmers</p>
        <div className="flex gap-4 mt-4">
          <Link 
            to="/list-property" 
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            ← List Land Instead
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Service Type */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Service Type *</label>
            <div className="grid grid-cols-3 gap-4">
              {(['equipment', 'agrovet', 'professional_services'] as const).map(type => (
                <label key={type} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={formData.type === type}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold">{typeLabels[type]}</div>
                    <div className="text-sm text-gray-500">
                      {type === 'equipment' && 'Rent farm machinery'}
                      {type === 'agrovet' && 'Sell farm inputs'}
                      {type === 'professional_services' && 'Offer expert services'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Service Details */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">
              {formData.type === 'equipment' ? 'Equipment/Company Name *' : 
               formData.type === 'agrovet' ? 'Agrovet Name *' : 
               'Service Provider Name *'}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder={
                formData.type === 'equipment' ? 'e.g., FarmTech Equipment Hire' :
                formData.type === 'agrovet' ? 'e.g., GreenFarm Agrovet' :
                'e.g., Kenya Land Surveyors'
              }
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Describe what you offer, your experience, and why farmers should choose you..."
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-gray-700 mb-2">County *</label>
            <select
              name="county"
              value={formData.county}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select County</option>
              {kenyaCounties.map(county => (
                <option key={county} value={county.toLowerCase()}>{county}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Constituency *</label>
            <input
              type="text"
              name="constituency"
              value={formData.constituency}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Kikuyu Constituency"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Ward *</label>
            <input
              type="text"
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Kinoo Ward"
              required
            />
          </div>

          {/* Services */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">
              {formData.type === 'equipment' ? 'Equipment/Services Offered *' : 
               formData.type === 'agrovet' ? 'Products/Services Offered *' : 
               'Services Offered *'}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {serviceOptions[formData.type].map((service: string) => (
                <label key={service} className="flex items-center p-2 border rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                    className="mr-2"
                  />
                  <span className="capitalize">{service}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Contact Phone *</label>
            <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 0712 345 678"
              pattern="[0-9]{10}"
              required
            />
          </div>

        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-800 text-sm">
            💡 <strong>Note:</strong> Service listings require annual subscription. 
            You'll be contacted for payment verification before your listing goes live.
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition duration-300 mt-6"
        >
          Submit Service Listing
        </button>
      </form>
    </div>
  );
};

export default ListService;
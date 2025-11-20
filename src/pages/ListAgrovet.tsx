import React, { useState, useEffect } from 'react';
import { useProperties } from '../contexts/PropertyContext';
import { Link } from 'react-router-dom';
import { kenyaCounties, getConstituenciesByCounty, getWardsByConstituency } from '../data/kenyaCounties';

interface AgrovetFormData {
  name: string;
  description: string;
  county: string;
  constituency: string;
  ward: string;
  town: string;
  approximateLocation: string;
  contact: string;
  openingHours: string;
  deliveryAvailable: boolean;
  
  // Categories
  products: boolean;
  animalHealth: boolean;
  cropProtection: boolean;
  equipment: boolean;
  
  // Specific Services
  seeds: string;
  fertilizers: string;
  animalFeeds: string;
  dewormers: boolean;
  vaccines: boolean;
  antibiotics: boolean;
  vitaminSupplements: boolean;
  artificialInsemination: boolean;
  pesticides: boolean;
  herbicides: boolean;
  fungicides: boolean;
  sprayers: boolean;
  waterPumps: boolean;
  protectiveGear: boolean;
  farmTools: boolean;
}

const ListAgrovet: React.FC = () => {
  const { addService } = useProperties();
  const [formData, setFormData] = useState<AgrovetFormData>({
    name: '',
    description: '',
    county: '',
    constituency: '',
    ward: '',
    town: '',
    approximateLocation: '',
    contact: '',
    openingHours: '',
    deliveryAvailable: false,
    
    // Categories
    products: false,
    animalHealth: false,
    cropProtection: false,
    equipment: false,
    
    // Services
    seeds: '',
    fertilizers: '',
    animalFeeds: '',
    dewormers: false,
    vaccines: false,
    antibiotics: false,
    vitaminSupplements: false,
    artificialInsemination: false,
    pesticides: false,
    herbicides: false,
    fungicides: false,
    sprayers: false,
    waterPumps: false,
    protectiveGear: false,
    farmTools: false
  });

  const [constituencies, setConstituencies] = useState<{value: string; label: string}[]>([]);
  const [wards, setWards] = useState<{value: string; label: string}[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Update constituencies when county changes
  useEffect(() => {
    if (formData.county) {
      const countyConstituencies = getConstituenciesByCounty(formData.county);
      setConstituencies(countyConstituencies);
      setFormData(prev => ({
        ...prev,
        constituency: '',
        ward: ''
      }));
      setWards([]);
    } else {
      setConstituencies([]);
      setWards([]);
    }
  }, [formData.county]);

  // Update wards when constituency changes
  useEffect(() => {
    if (formData.county && formData.constituency) {
      const constituencyWards = getWardsByConstituency(formData.county, formData.constituency);
      setWards(constituencyWards);
      setFormData(prev => ({
        ...prev,
        ward: ''
      }));
    } else {
      setWards([]);
    }
  }, [formData.county, formData.constituency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Convert to ServiceFormData format
      const serviceData = {
        type: 'agrovet' as const,
        name: formData.name,
        description: formData.description,
        county: formData.county,
        constituency: formData.constituency,
        ward: formData.ward,
        contact: formData.contact,
        services: getSelectedServices()
      };
      
      await addService(serviceData);
      alert('Agrovet listed successfully! It will appear after verification.');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        county: '',
        constituency: '',
        ward: '',
        town: '',
        approximateLocation: '',
        contact: '',
        openingHours: '',
        deliveryAvailable: false,
        products: false,
        animalHealth: false,
        cropProtection: false,
        equipment: false,
        seeds: '',
        fertilizers: '',
        animalFeeds: '',
        dewormers: false,
        vaccines: false,
        antibiotics: false,
        vitaminSupplements: false,
        artificialInsemination: false,
        pesticides: false,
        herbicides: false,
        fungicides: false,
        sprayers: false,
        waterPumps: false,
        protectiveGear: false,
        farmTools: false
      });
      setConstituencies([]);
      setWards([]);
      
    } catch (error) {
      alert('Error listing agrovet. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const getSelectedServices = (): string[] => {
    const services: string[] = [];
    
    // Products
    if (formData.seeds) services.push(`Seeds: ${formData.seeds}`);
    if (formData.fertilizers) services.push(`Fertilizers: ${formData.fertilizers}`);
    if (formData.animalFeeds) services.push(`Animal Feeds: ${formData.animalFeeds}`);
    
    // Animal Health
    if (formData.dewormers) services.push('Dewormers');
    if (formData.vaccines) services.push('Vaccines');
    if (formData.antibiotics) services.push('Antibiotics');
    if (formData.vitaminSupplements) services.push('Vitamin Supplements');
    if (formData.artificialInsemination) services.push('Artificial Insemination');
    
    // Crop Protection
    if (formData.pesticides) services.push('Pesticides');
    if (formData.herbicides) services.push('Herbicides');
    if (formData.fungicides) services.push('Fungicides');
    
    // Equipment
    if (formData.sprayers) services.push('Sprayers');
    if (formData.waterPumps) services.push('Water Pumps');
    if (formData.protectiveGear) services.push('Protective Gear');
    if (formData.farmTools) services.push('Farm Tools');
    
    return services;
  };

  const countiesForDropdown = kenyaCounties.map(county => ({
    value: county.name.toLowerCase(),
    label: county.name
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">List Your Agrovet</h1>
        <p className="text-gray-600">Connect with farmers by listing your agricultural products and services</p>
        <div className="flex gap-4 mt-4">
          <Link 
            to="/list-property" 
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            ← List Land Instead
          </Link>
          <Link 
            to="/list-service" 
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            ← Other Services
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Basic Information */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Agrovet Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., GreenFarm Agrovet"
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
              placeholder="Describe your agrovet, your specialties, and why farmers should choose you..."
              required
            />
          </div>

          {/* Location with Dropdowns */}
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
              {countiesForDropdown.map(county => (
                <option key={county.value} value={county.value}>{county.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Constituency *</label>
            <select
              name="constituency"
              value={formData.constituency}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={!formData.county}
            >
              <option value="">{formData.county ? 'Select Constituency' : 'Select County First'}</option>
              {constituencies.map(constituency => (
                <option key={constituency.value} value={constituency.value}>{constituency.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Ward *</label>
            <select
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={!formData.constituency}
            >
              <option value="">{formData.constituency ? 'Select Ward' : 'Select Constituency First'}</option>
              {wards.map(ward => (
                <option key={ward.value} value={ward.value}>{ward.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Town/Area</label>
            <input
              type="text"
              name="town"
              value={formData.town}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Kikuyu Town"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Approximate Location *</label>
            <input
              type="text"
              name="approximateLocation"
              value={formData.approximateLocation}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Near Kikuyu Market, next to petrol station"
              required
            />
          </div>

          {/* Service Categories */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-3">What do you offer? *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="products"
                  checked={formData.products}
                  onChange={handleChange}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">🛒 Products</div>
                  <div className="text-xs text-gray-500">Seeds, fertilizers, feeds</div>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="animalHealth"
                  checked={formData.animalHealth}
                  onChange={handleChange}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">💊 Animal Health</div>
                  <div className="text-xs text-gray-500">Dewormers, vaccines</div>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="cropProtection"
                  checked={formData.cropProtection}
                  onChange={handleChange}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">🌱 Crop Protection</div>
                  <div className="text-xs text-gray-500">Pesticides, herbicides</div>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="equipment"
                  checked={formData.equipment}
                  onChange={handleChange}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">🔧 Equipment</div>
                  <div className="text-xs text-gray-500">Tools, sprayers, pumps</div>
                </div>
              </label>
            </div>
          </div>

          {/* Products Section */}
          {formData.products && (
            <div className="md:col-span-2 border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-800 mb-3">🛒 Products & Supplies</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Seeds Available</label>
                  <input
                    type="text"
                    name="seeds"
                    value={formData.seeds}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., maize, beans, vegetables"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fertilizers</label>
                  <input
                    type="text"
                    name="fertilizers"
                    value={formData.fertilizers}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., DAP, CAN, Urea"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Animal Feeds</label>
                  <input
                    type="text"
                    name="animalFeeds"
                    value={formData.animalFeeds}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., dairy, poultry, pig"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Animal Health Section */}
          {formData.animalHealth && (
            <div className="md:col-span-2 border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-800 mb-3">💊 Animal Health Services</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { name: 'dewormers', label: 'Dewormers' },
                  { name: 'vaccines', label: 'Vaccines' },
                  { name: 'antibiotics', label: 'Antibiotics' },
                  { name: 'vitaminSupplements', label: 'Vitamin Supplements' },
                  { name: 'artificialInsemination', label: 'AI Services' }
                ].map(service => (
                  <label key={service.name} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      name={service.name}
                      checked={formData[service.name as keyof AgrovetFormData] as boolean}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    {service.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Crop Protection Section */}
          {formData.cropProtection && (
            <div className="md:col-span-2 border-l-4 border-yellow-500 pl-4">
              <h3 className="font-semibold text-gray-800 mb-3">🌱 Crop Protection</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { name: 'pesticides', label: 'Pesticides' },
                  { name: 'herbicides', label: 'Herbicides' },
                  { name: 'fungicides', label: 'Fungicides' }
                ].map(service => (
                  <label key={service.name} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      name={service.name}
                      checked={formData[service.name as keyof AgrovetFormData] as boolean}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    {service.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Equipment Section */}
          {formData.equipment && (
            <div className="md:col-span-2 border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-gray-800 mb-3">🔧 Equipment & Tools</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: 'sprayers', label: 'Sprayers' },
                  { name: 'waterPumps', label: 'Water Pumps' },
                  { name: 'protectiveGear', label: 'Protective Gear' },
                  { name: 'farmTools', label: 'Farm Tools' }
                ].map(service => (
                  <label key={service.name} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      name={service.name}
                      checked={formData[service.name as keyof AgrovetFormData] as boolean}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    {service.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
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

          <div>
            <label className="block text-gray-700 mb-2">Opening Hours</label>
            <input
              type="text"
              name="openingHours"
              value={formData.openingHours}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Mon-Sat: 8AM-6PM"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="deliveryAvailable"
              checked={formData.deliveryAvailable}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-gray-700">Delivery Available</label>
          </div>

        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">
            💡 <strong>Note:</strong> Your agrovet will be verified before appearing in search results. 
            Farmers will be able to contact you directly.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3 rounded-lg font-semibold text-lg transition duration-300 mt-6 ${
            submitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {submitting ? 'Listing Agrovet...' : 'List Agrovet'}
        </button>
      </form>
    </div>
  );
};

export default ListAgrovet;
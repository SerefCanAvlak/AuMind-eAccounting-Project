import { useEffect, useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { cities } from "../../../constants/cities";

const initialState = {
  name: "",
  typeValue: "",
  city: "",
  town: "",
  fullAddress: "",
  taxDepartment: "",
  taxNumber: "",
};

function CariModal({ isOpen, isEditMode, cari, onClose, onSubmit }) {
  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (isEditMode && cari) {
      setFormData({
        name: cari.name || "",
        typeValue: cari.typeValue || "",
        city: cari.city || "",
        town: cari.town || "",
        fullAddress: cari.fullAddress || "",
        taxDepartment: cari.taxDepartment || "",
        taxNumber: cari.taxNumber || "",
      });
    } else {
      setFormData(initialState);
    }
  }, [isEditMode, cari, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "inflow" || name === "checkout" || name === "balance") {
      // Sadece sayılar ve nokta karakterine izin ver
      const sanitizedValue = value.replace(/[^\d.-]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: sanitizedValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, isEditMode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-center text-xl font-medium mb-4">
          {isEditMode ? "Cari Düzenle" : "Yeni Cari Ekle"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Cari Adı</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 bg-white"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Cari Tipi</label>
              <div className="relative">
                <select
                  name="typeValue"
                  value={formData.typeValue}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 bg-white appearance-none pr-10"
                  required
                >
                  <option value="">Seçiniz...</option>
                  <option value="1">Ticari Alıcılar</option>
                  <option value="2">Ticari Satıcılar</option>
                  <option value="3">Personel</option>
                  <option value="4">Şirket Ortakları</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={16}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-1">İl</label>
              <div className="relative">
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 bg-white appearance-none pr-10"
                  required
                >
                  <option value="">Seçiniz...</option>
                  {Object.keys(cities).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={16}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-1">İlçe</label>
              <input
                type="text"
                name="town"
                value={formData.town}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 bg-white"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Vergi Dairesi</label>
              <input
                type="text"
                name="taxDepartment"
                value={formData.taxDepartment}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 bg-white"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Vergi Numarası</label>
              <input
                type="text"
                name="taxNumber"
                value={formData.taxNumber}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 bg-white"
                required
              />
            </div>

            <div className="mb-4 col-span-2">
              <label className="block text-gray-700 mb-1">Adres</label>
              <input
                type="text"
                name="fullAddress"
                value={formData.fullAddress}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <button
              type="submit"
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md"
            >
              {isEditMode ? "Güncelle" : "Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CariModal;

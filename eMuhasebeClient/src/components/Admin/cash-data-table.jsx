import { useState } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import LoadingOverlay from "../UI/Spinner/LoadingOverlay";

// CashDataTable bileşeni
function DataTable({
  title,
  addButtonText,
  addButtonColor = "blue",
  columns,
  data,
  searchPlaceholder = "İsim Giriniz...",
  onAdd,
  onEdit,
  onDelete,
  onSearch,
  itemsPerPage = 50,
  currentPage = 1,
  totalItems = 0,
  onPageChange,
  customButtons, // Özel butonlar için prop
  customFilters = null, // Özel filtreler için prop
  headerColor = "gray-700", // Tablo başlığı arka plan rengi
  headerTextColor = "white", // Tablo başlığı metin rengi
  isLoading = false, // Yükleme durumu
  hideTitle = false, // Başlığı gizleme seçeneği
  selectedItems,
  onSelectedItemsChange,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // Arama işlemi
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  // Checkbox işlemleri
  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      onSelectedItemsChange(selectedItems.filter((item) => item !== id));
    } else {
      onSelectedItemsChange([...selectedItems, id]);
    }
  };

  // Sayfalama hesaplamaları
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Buton rengi belirleme
  const buttonColorClass =
    addButtonColor === "yellow"
      ? "bg-yellow-400 hover:bg-yellow-500 text-gray-800"
      : "bg-blue-600 hover:bg-blue-700 text-white";

  const renderCell = (column, row, rowIndex) => {
    let value;
    if (column.accessor === "id") {
      return (currentPage - 1) * itemsPerPage + rowIndex + 1;
    }
    
    if (typeof column.accessor === 'function') {
      value = column.accessor(row);
    } else if (typeof column.accessor === 'string' && column.accessor.includes('.')) {
      const [first, second] = column.accessor.split('.');
      value = row[first]?.[second];
    } else if (typeof column.accessor === 'string') {
      value = row[column.accessor];
    } else {
      value = '';
    }

    if (column.Cell) {
      return column.Cell({ value, row });
    }
    if (column.render) {
      return column.render(row);
    }
    return value;
  };

  return (
    <div className="bg-gray-100">
      {/* Başlık */}
      {!hideTitle && (
        <h1 className="text-3xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-6">
          {title}
        </h1>
      )}

      {/* Üst Araç Çubuğu */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <button
            onClick={onAdd}
            className={`${buttonColorClass} font-medium py-2 px-4 rounded-md flex items-center`}
            disabled={isLoading}
          >
            <Plus size={18} className="mr-1" />
            {addButtonText}
          </button>

          {/* Özel butonlar varsa göster */}
          {customButtons}
        </div>

        <div className="flex items-center space-x-4">
          {/* Özel filtreler varsa göster */}
          {customFilters}

          <div className="relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearch}
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 w-64"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Search size={18} className="text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingOverlay message="Veriler yükleniyor..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              {/* Tablo Başlığı */}
              <thead>
                <tr className={`bg-${headerColor} text-${headerTextColor}`}>
                  <th className="w-12 p-3 text-left">
                    <Edit size={18} />
                  </th>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className={`p-3 text-left ${column.className || ""}`}
                    >
                      {column.header}
                    </th>
                  ))}
                  <th className="w-12 p-3 text-center">
                    <Trash2 size={18}  className="text-red-500 mx-auto" />
                  </th>
                </tr>
              </thead>

              {/* Tablo Gövdesi */}
              <tbody>
                {data && data.length > 0
                  ? data.map((item, rowIndex) => (
                      <tr
                        key={item?.id || rowIndex}
                        className="border-b border-gray-300 hover:bg-gray-200"
                      >
                        <td className="p-3">
                          <button
                            onClick={() => onEdit(item)}
                            className="bg-blue-500 text-white hover:text-yellow-400 p-1 rounded"
                          >
                            <Edit size={18} />
                          </button>
                        </td>

                        {columns.map((column, colIndex) => (
                          <td
                            key={colIndex}
                            className={`p-3 ${column.className || ""}`}
                          >
                            {renderCell(column, item, rowIndex)}
                          </td>
                        ))}

                        <td className="p-3 text-center">
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item?.id)}
                              onChange={() => handleSelectItem(item?.id)}
                              className="h-5 w-5 text-red-500 border-gray-300 rounded focus:ring-red-500"
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  : // Veri yoksa tek satırda bilgi göster
                    <tr className="border-b border-gray-300">
                      <td colSpan={columns.length + 2} className="p-4 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center py-4">
                          <p className="text-lg font-medium text-red-500">Veri bulunamadı!</p>
                          <p className="text-sm">Listelenecek veri bulunmamaktadır.</p>
                        </div>
                      </td>
                    </tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sayfalama */}
      <div className="flex justify-end items-center mt-4 text-sm text-gray-600">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="p-1 mr-2 disabled:opacity-50"
        >
          <ChevronLeft size={18} />
        </button>

        <span>
          {startItem}-{endItem} arası gösteriliyor.{" "}
        </span>

        {totalPages > 1 && (
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="p-1 ml-2 disabled:opacity-50"
          >
            <span>Devam et</span>
            <ChevronRight size={18} className="inline ml-1" />
          </button>
        )}
      </div>
    </div>
  );
}

export default DataTable;

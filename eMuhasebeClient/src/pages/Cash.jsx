import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/Admin/data-table";
import { Info, Trash2 } from "lucide-react";
import LoadingOverlay from "../components/UI/Spinner/LoadingOverlay";
import CashModal from "../components/UI/Modals/CashModal";
import DeleteConfirmationModal from "../components/UI/Modals/DeleteConfirmationModal";
import {
  useGetAllCashRegistersMutation,
  useCreateCashRegisterMutation,
  useUpdateCashRegisterMutation,
  useDeleteCashRegisterMutation,
} from "../store/api";
import { useToast } from "../hooks/useToast";
const Cash = () => {
  const navigate = useNavigate();
  const [currents, setCurrents] = useState([]);
  const [filteredCurrents, setFilteredCurrents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCash, setSelectedCash] = useState(null);
  const [cashToDelete, setCashToDelete] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const { showToast } = useToast();

  // RTK Query Hooks
  const [getAllCashRegisters, { isLoading: isLoadingCashRegisters }] =
    useGetAllCashRegistersMutation();
  const [createCashRegister, { isLoading: isCreatingCashRegister }] =
    useCreateCashRegisterMutation();
  const [updateCashRegister, { isLoading: isUpdatingCashRegister }] =
    useUpdateCashRegisterMutation();
  const [deleteCashRegister, { isLoading: isDeletingCashRegister }] =
    useDeleteCashRegisterMutation();

  // Sayfa başına gösterilecek kasa sayısı
  const itemsPerPage = 50;

  // Detay butonu render fonksiyonu
  const renderDetailButton = (cash) => (
    <div className="flex justify-end mr-5">
      <button
        onClick={() => navigate(`/cash-transaction/${cash.id}`)}
        className="bg-yellow-300 hover:bg-yellow-400 text-gray-800 font-medium py-1 px-3 rounded-md flex items-center"
      >
        <Info size={16} className="mr-1" />
        Detay Gör
      </button>
    </div>
  );

  // Kasalar tablosu sütun tanımları
  const columns = [
    {
      header: "# Numara",
      accessor: "id",
      className: "w-24 font-bold text-yellow-500",
    },
    { header: "Kasa Adı", accessor: "name" },
    { header: "Döviz Tipi", accessor: "currencyType.name" },
    {
      header: "Giriş",
      accessor: "depositAmount",
      className: "text-right text-green-600",
    },
    {
      header: "Çıkış",
      accessor: "withdrawalAmount",
      className: "text-right text-red-600",
    },
    {
      header: "Bakiye",
      accessor: "balance",
      Cell: ({ row }) => {
        const deposit = parseFloat(row.depositAmount) || 0;
        const withdrawal = parseFloat(row.withdrawalAmount) || 0;
        const balance = deposit - withdrawal;
        return (
          <span
            className={`text-right font-bold ${
              balance >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {balance.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        );
      },
    },
    {
      header: "İşlemler",
      accessor: "transactions",
      render: renderDetailButton,
    },
  ];
  const fetchData = async () => {
    try {
      const result = await getAllCashRegisters().unwrap();
      const cashArray = Array.isArray(result.data) ? result.data : [];
      setCurrents(cashArray);
      setFilteredCurrents(cashArray);
    } catch (error) {
      console.error("Error fetching cash registers:", error);
      setCurrents([]);
      setFilteredCurrents([]);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  // Sayfalama işlemleri
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= Math.ceil(filteredCurrents.length / itemsPerPage)
    ) {
      setCurrentPage(newPage);
    }
  };

  // Kasa ekleme
  const handleAddCash = () => {
    setIsAddModalOpen(true);
  };

  // Kasa düzenleme
  const handleEditCash = (cash) => {
    setSelectedCash(cash);
    setIsEditModalOpen(true);
  };

  // Kasa ekleme işlemi
  const handleAddSubmit = async (cash) => {
    const currencyType =
      cash.currencyTypeValue === "TL"
        ? 1
        : cash.currencyTypeValue === "USD"
        ? 2
        : cash.currencyTypeValue === "EUR"
        ? 3
        : 1;

    const result = await createCashRegister({
      ...cash,
      currencyTypeValue: currencyType,
    })
      .unwrap()
      .then(() => {
        showToast("Kasa başarıyla eklendi", "success");
        setIsAddModalOpen(false);
        setSelectedCash(null);
        fetchData();
      })
      .catch((err) => {
        showToast(err.data?.errorMessages?.[0], "error");
      });
  };

  // Kasa düzenleme işlemi
  const handleEditSubmit = async (cash) => {
    const currencyType =
      cash.currencyTypeValue === "TL"
        ? 1
        : cash.currencyTypeValue === "USD"
        ? 2
        : cash.currencyTypeValue === "EUR"
        ? 3
        : 1;
    const result = await updateCashRegister({
      id: selectedCash.id,
      ...cash,
      currencyTypeValue: currencyType,
    })
      .unwrap()
      .then(() => {
        showToast("Kasa başarıyla güncellendi", "success");
        setIsEditModalOpen(false);
        setSelectedCash(null);
        fetchData();
      })
      .catch((err) => {
        showToast(err.data?.errorMessages?.[0], "error");
      });
  };

  // Kasa silme işlemi
  const handleDeleteCash = (cashId) => {
    console.log(cashId);
    if (Array.isArray(cashId)) {
      // Toplu silme
      setCashToDelete({ ids: cashId, name: `${cashId.length} kasa` });
    } else {
      // Tekli silme
      const cash = currents.find((c) => c.id === cashId);
      setCashToDelete({ ids: [cashId], name: cash.name });
    }
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (cashToDelete) {
      try {
        if (Array.isArray(cashToDelete.ids)) {
          // Toplu silme
          for (const id of cashToDelete.ids) {
            await deleteCashRegister(id);
          }
          showToast(
            `${cashToDelete.ids.length} kasa başarıyla silindi`,
            "success"
          );
        } else {
          // Tekli silme
          await deleteCashRegister(cashToDelete.ids);
          showToast(`${cashToDelete.name} kasa başarıyla silindi`, "success");
        }
        // Update the currents state to remove deleted items
        const updatedCurrents = currents.filter(
          (cash) => !cashToDelete.ids.includes(cash.id)
        );
        setCurrents(updatedCurrents);
        setFilteredCurrents(updatedCurrents);
      } catch (error) {
        console.error("Error deleting cash register:", error);
        showToast("Kasa silinirken bir hata oluştu", "error");
      }
      setIsDeleteModalOpen(false);
      setCashToDelete(null);
      setSelectedItems([]);
    }
  };

  // Kasa arama işlemi
  const handleSearch = (searchTerm) => {
    setFilteredCurrents(
      currents.filter((cash) =>
        cash.name.toLowerCase().trim().includes(searchTerm.toLowerCase().trim())
      )
    );
    setCurrentPage(1);
  };

  // Özel butonlar
  const customButtons = (
    <>
      {selectedItems.length > 0 && (
        <button
          onClick={() => handleDeleteCash(selectedItems)}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md flex items-center"
        >
          <Trash2 size={18} className="mr-2" />
          Seçilenleri Sil ({selectedItems.length})
        </button>
      )}
    </>
  );

  // Sayfa başına listeleme işlemi
  const currentCash = Array.isArray(currents)
    ? currents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : [];

  return (
    <>
      <DataTable
        title="Kasalar"
        addButtonText="Kasa Ekle"
        addButtonColor="yellow"
        columns={columns}
        data={filteredCurrents}
        searchPlaceholder="Kasa Adı Giriniz..."
        onAdd={handleAddCash}
        onEdit={handleEditCash}
        onDelete={handleDeleteCash}
        onSearch={handleSearch}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalItems={filteredCurrents.length}
        onPageChange={handlePageChange}
        customButtons={customButtons}
        headerColor="gray-800"
        headerTextColor="white"
        selectedItems={selectedItems}
        onSelectedItemsChange={setSelectedItems}
      />
      <CashModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCash={handleAddSubmit}
      />
      <CashModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCash(null);
        }}
        isEditMode={true}
        onEditCash={handleEditSubmit}
        cash={selectedCash}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCashToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Kasa Silme"
        message={`${cashToDelete?.name || ""} ${
          cashToDelete?.ids?.length > 1 ? "kasalarını" : "kasasını"
        } silmek istediğinizden emin misiniz?`}
      />
    </>
  );
};

export default Cash;

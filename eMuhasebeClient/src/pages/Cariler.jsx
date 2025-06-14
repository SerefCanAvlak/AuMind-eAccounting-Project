import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/Admin/data-table";
import { Info, Trash2 } from "lucide-react";
import LoadingOverlay from "../components/UI/Spinner/LoadingOverlay";
import CariModal from "../components/UI/Modals/CariModal";
import DeleteConfirmationModal from "../components/UI/Modals/DeleteConfirmationModal";
import {
  useGetAllCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from "../store/api";
import { useToast } from "../hooks/useToast";

const Cariler = () => {
  const navigate = useNavigate();
  const [currents, setCurrents] = useState([]);
  const [filteredCurrents, setFilteredCurrents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  // const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCari, setSelectedCari] = useState(null);
  const [cariToDelete, setCariToDelete] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const { showToast } = useToast();

  // Redux hooks
  // const dispatch = useDispatch();
  // const { isAddModalOpen, isEditModalOpen, isDeleteModalOpen } = useSelector(
  //   (state) => state.modal
  // );

  // RTK Query hooks
  const { data, isLoading, error, refetch } = useGetAllCustomersQuery();
  const [createCustomer, { isLoading: isCreatingCustomer }] =
    useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdatingCustomer }] =
    useUpdateCustomerMutation();
  const [deleteCustomer, { isLoading: isDeletingCustomer }] =
    useDeleteCustomerMutation();

  // Sayfa başına gösterilecek cari hesap sayısı
  const itemsPerPage = 50;

  // Detay butonu render fonksiyonu
  const renderDetailButton = (cari) => (
    <button
      onClick={() => navigate(`/cari-hareketleri/${cari.id}`)}
      className="bg-yellow-300 hover:bg-yellow-400 text-gray-800 font-medium py-1 px-3 rounded-md flex items-center"
    >
      <Info size={16} className="mr-1" />
      Detay Gör
    </button>
  );

  // Cariler tablosu sütun tanımları
  const columns = [
    {
      header: "# Numara",
      accessor: "id",
      className: "w-24 font-bold text-yellow-500",
    },
    { header: "Cari Adı", accessor: "name" },
    {
      header: "Tipi",
      accessor: "type",
      render: (row) => row.type?.name || "-",
    },
    { header: "İl", accessor: "city" },
    { header: "İlçe", accessor: "town" },
    { header: "Adres", accessor: "fullAddress" },
    { header: "Vergi Dairesi", accessor: "taxDepartment" },
    { header: "Vergi Numarası", accessor: "taxNumber" },
    { header: "Giriş", accessor: "depositAmount" },
    { header: "Çıkış", accessor: "withdrawalAmount" },
    {
      header: "Bakiye",
      accessor: "balance",
      Cell: ({ row }) => {
        const deposit = parseFloat(row.depositAmount) || 0;
        const withdrawal = parseFloat(row.withdrawalAmount) || 0;
        const balance = deposit - withdrawal;
        return (
          <span className={balance >= 0 ? "text-green-600" : "text-red-600"}>
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

  useEffect(() => {
    if (data?.isSuccessful) {
      const formattedData = Array.isArray(data.data) ? data.data : [];
      setCurrents(formattedData);
      setFilteredCurrents(formattedData);
    } else if (error) {
      console.error(
        error?.errorMessages?.[0] || "Müşteriler yüklenirken bir hata oluştu"
      );
    }
  }, [data]);

  // Sayfalama işlemleri
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= Math.ceil(filteredCurrents.length / itemsPerPage)
    ) {
      setCurrentPage(newPage);
    }
  };

  // Cari hesap ekleme
  const handleAddCari = () => {
    setIsAddModalOpen(true);
  };

  // Cari hesap düzenleme
  const handleEditCari = (cari) => {
    setSelectedCari(cari);
    setIsEditModalOpen(true);
  };

  // Cari hesap ekleme ve düzenleme işlemleri
  const handleSubmitCari = async (formData, isEditMode) => {
    if (isEditMode) {
      await updateCustomer(formData)
        .unwrap()
        .then(() => {
          showToast("Cari hesap başarıyla güncellendi", "success");
          setIsEditModalOpen(false);
          setSelectedCari(null);
          refetch();
        })
        .catch((err) => {
          showToast(err.data?.errorMessages?.[0], "error");
        });
    } else {
      await createCustomer(formData)
        .unwrap()
        .then(() => {
          showToast("Cari hesap başarıyla eklendi", "success");
          setIsAddModalOpen(false);
          setSelectedCari(null);
          refetch();
        })
        .catch((err) => {
          showToast(err.data?.errorMessages?.[0], "error");
        });
    }
  };

  const handleEditCariSubmit = async (formData) => {
    await handleSubmitCari({ id: selectedCari.id, ...formData }, true);
  };

  // Cari hesap silme işlemi
  const handleDeleteCari = (cariId) => {
    if (Array.isArray(cariId)) {
      // Toplu silme
      setCariToDelete({ ids: cariId, name: `${cariId.length} cari hesap` });
    } else {
      // Tekli silme
      const cari = currents.find((c) => c.id === cariId);
      setCariToDelete({ ids: [cariId], name: cari.name });
    }
    setIsDeleteModalOpen(true);
  };

  // Silme onaylama işlemi
  const confirmDelete = async () => {
    if (cariToDelete) {
      if (cariToDelete) {
        try {
          if (Array.isArray(cariToDelete.ids)) {
            // Toplu silme
            for (const id of cariToDelete.ids) {
              await deleteCustomer(id);
            }
            showToast(
              `${cariToDelete.ids.length} cari hesap başarıyla silindi`,
              "success"
            );
          } else {
            // Tekli silme
            await deleteCustomer(cariToDelete.ids);
            showToast(
              `${cariToDelete.name} cari hesap başarıyla silindi`,
              "success"
            );
          }
          // Update the currents state to remove deleted items
          const updatedCurrents = currents.filter(
            (cash) => !cariToDelete.ids.includes(cash.id)
          );
          setCurrents(updatedCurrents);
          setFilteredCurrents(updatedCurrents);
        } catch (error) {
          console.error("Error deleting cash register:", error);
          showToast("Kasa silinirken bir hata oluştu", "error");
        }
        setIsDeleteModalOpen(false);
        setCariToDelete(null);
        setSelectedItems([]);
      }
    }
  };

  // Cari hesap arama işlemi
  const handleSearch = (searchTerm) => {
    setFilteredCurrents(
      currents.filter((cari) =>
        cari.name.toLowerCase().trim().includes(searchTerm.toLowerCase().trim())
      )
    );
    setCurrentPage(1);
  };

  // Özel butonlar
  const customButtons = (
    <>
      {selectedItems.length > 0 && (
        <button
          onClick={() => handleDeleteCari(selectedItems)}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md flex items-center"
        >
          <Trash2 size={18} className="mr-2" />
          Seçilenleri Sil ({selectedItems.length})
        </button>
      )}
    </>
  );

  // Sayfa başına listeleme işlemi
  const currentCariler = filteredCurrents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <DataTable
        title="Cariler"
        addButtonText="Cari Ekle"
        addButtonColor="yellow"
        columns={columns}
        data={currentCariler}
        searchPlaceholder="Cari Adı Giriniz..."
        onAdd={handleAddCari}
        onEdit={handleEditCari}
        onDelete={handleDeleteCari}
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
      <CariModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleSubmitCari}
      />
      <CariModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCari(null);
        }}
        isEditMode={true}
        cari={selectedCari}
        onSubmit={handleEditCariSubmit}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCariToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Cari Hesap Silme"
        message={`${cariToDelete?.name || ""} ${
          cariToDelete?.ids?.length > 1 ? "cari hesaplarını" : "cari hesabını"
        } silmek istediğinizden emin misiniz?`}
      />
    </>
  );
};

export default Cariler;

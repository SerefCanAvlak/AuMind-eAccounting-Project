import React, { useEffect, useState } from "react";
import DataTable from "../../components/Admin/data-table";
import { Info, Trash2 } from "lucide-react";
import LoadingOverlay from "../../components/UI/Spinner/LoadingOverlay";
import InvoiceModal from "../../components/UI/Modals/InvoiceModal";
import DeleteConfirmationModal from "../../components/UI/Modals/DeleteConfirmationModal";
import { useToast } from "../../hooks/useToast";
import {
  useGetAllInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
} from "../../store/api/invoicesApi";
import { useGetAllCustomersQuery } from "../../store/api";

const Faturalar = () => {
  const [faturalar, setFaturalar] = useState([]);
  const [filteredFaturalar, setFilteredFaturalar] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState(null);
  const [faturaToDelete, setFaturaToDelete] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const { showToast } = useToast();

  // RTK Query hooks
  const getAllInvoices = useGetAllInvoicesQuery();
  const [createInvoice] = useCreateInvoiceMutation();
  const [updateInvoice] = useUpdateInvoiceMutation();
  const [deleteInvoice] = useDeleteInvoiceMutation();

  const { data } = useGetAllCustomersQuery();

  const itemsPerPage = 50;

  // Faturalar tablosu sütun tanımları
  const columns = [
    {
      header: "# Numara",
      accessor: "id",
      className: "w-24 font-bold text-yellow-500",
    },
    {
      header: "Fatura Tipi",
      accessor: (row) => row.type?.name || "-",
    },
    {
      header: "Fatura No",
      accessor: "invoiceNumber",
    },
    {
      header: "Tarih",
      accessor: (row) => new Date(row.date).toLocaleDateString("tr-TR"),
    },
    {
      header: "Müşteri",
      accessor: (row) => row.customer?.name || row.name || "-",
    },
    {
      header: "Tutar",
      accessor: "amount",
      className: "text-right",
    },
    {
      header: "KDV",
      accessor: (row) => {
        // KDV hesaplaması yapılacaksa burada yapılabilir
        const kdv = row.details?.reduce((acc, item) => {
          return acc + item.price * item.quantity * 0.2; // %20 KDV örneği
        }, 0);
        return kdv?.toFixed(2) || "0.00";
      },
      className: "text-right",
    },
    {
      header: "Toplam",
      accessor: (row) => {
        const total = row.details?.reduce((acc, item) => {
          return acc + item.price * item.quantity;
        }, 0);
        return total?.toFixed(2) || "0.00";
      },
      className: "text-right font-bold",
    },
    {
      header: "Durum",
      accessor: (row) => (row.isDeleted ? "Silinmiş" : "Aktif"),
    },
  ];

  // Faturalar için useEffect
  useEffect(() => {
    if (getAllInvoices.data) {
      const data = getAllInvoices.data.data || getAllInvoices.data;

      setFaturalar(data);
      setFilteredFaturalar(data);
      setIsLoading(false);
    }
  }, [getAllInvoices]);

  // Sayfalama işlemleri
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= Math.ceil(filteredFaturalar.length / itemsPerPage)
    ) {
      setCurrentPage(newPage);
    }
  };

  // Fatura ekleme işlemi
  const handleAddFatura = () => {
    setIsAddModalOpen(true);
  };

  // Fatura düzenleme işlemi
  const handleEditFatura = (fatura) => {
    setSelectedFatura(fatura);
    setIsEditModalOpen(true);
  };

  const handleAddInvoice = async (formData) => {
    try {
      await createInvoice(formData);
      setIsAddModalOpen(false);
      showToast("Fatura başarıyla oluşturuldu", "success");
    } catch (error) {
      showToast(
        error.data?.errorMessages?.[0] ||
          "Fatura oluşturulurken bir hata oluştu",
        "error"
      );
    }
  };

  // Fatura silme işlemi
  const handleDeleteFatura = (faturaId) => {
    if (Array.isArray(faturaId)) {
      // Toplu silme
      console.log("id", faturaId);
      setFaturaToDelete({ ids: faturaId, name: `${faturaId.length} fatura` });
    } else {
      // Tekli silme
      const fatura = faturalar.find((f) => f.id === faturaId);
      setFaturaToDelete({ ids: [faturaId], name: fatura.invoiceNumber });
    }
    setIsDeleteModalOpen(true);
  };

  // Silme onaylama işlemi
  const confirmDelete = async () => {
    if (faturaToDelete) {
      try {
        if (Array.isArray(faturaToDelete.ids)) {
          // Toplu silme
          for (const id of faturaToDelete.ids) {
            await deleteInvoice(id);
          }
          showToast(
            `${faturaToDelete.ids.length} fatura başarıyla silindi`,
            "success"
          );
        } else {
          // Tekli silme
          await deleteInvoice(faturaToDelete.ids);
          showToast(
            `${faturaToDelete.name} fatura başarıyla silindi`,
            "success"
          );
        }
        // Update the faturalar state to remove deleted items
        const updatedFaturalar = faturalar.filter(
          (fatura) => !faturaToDelete.ids.includes(fatura.id)
        );
        setFaturalar(updatedFaturalar);
        setFilteredFaturalar(updatedFaturalar);
      } catch (error) {
        console.error("Error deleting invoice:", error);
        showToast(
          error.data?.errorMessages?.[0] || "Fatura silinirken bir hata oluştu",
          "error"
        );
      }
      setIsDeleteModalOpen(false);
      setFaturaToDelete(null);
    }
  };

  // Fatura ekleme işlemi
  // const handleInvoiceSubmit = async (invoiceData) => {
  //   try {
  //     debugger;
  //     await createInvoice(invoiceData).unwrap();
  //     showToast("Fatura başarıyla oluşturuldu", "success");
  //     setIsAddModalOpen(false);
  //   } catch (err) {
  //     console.error("Error creating invoice:", err);
  //     showToast(
  //       err.data?.errorMessages?.[0] || "Fatura oluşturulurken bir hata oluştu",
  //       "error"
  //     );
  //   }
  // };

  // Fatura güncelleme işlemi
  const handleEditSubmit = async (invoiceData) => {
    try {
      debugger;
      await updateInvoice({ id: selectedFatura.id, ...invoiceData }).unwrap();
      showToast("Fatura başarıyla güncellendi", "success");
      setIsEditModalOpen(false);
      setSelectedFatura(null);
    } catch (err) {
      console.error("Error updating invoice:", err);
      showToast(
        err.data?.errorMessages?.[0] || "Fatura güncellenirken bir hata oluştu",
        "error"
      );
    }
  };

  // Fatura arama işlemi
  const handleSearch = (searchTerm) => {
    if (searchTerm.trim() === "") {
      setFilteredFaturalar(faturalar);
    } else {
      const filtered = faturalar.filter(
        (fatura) =>
          fatura.invoiceNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          fatura.customer.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFaturalar(filtered);
      setCurrentPage(1); // Arama yapıldığında ilk sayfaya dön
    }
  };

  // Özel butonlar
  const customButtons = (
    <>
      {selectedItems.length > 0 && (
        <button
          onClick={() => handleDeleteFatura(selectedItems)}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md flex items-center"
        >
          <Trash2 size={18} className="mr-2" />
          Seçilenleri Sil ({selectedItems.length})
        </button>
      )}
    </>
  );

  // Geçerli sayfadaki faturaları hesapla
  const currentFaturalar = filteredFaturalar.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // if (isLoading) {
  //   return (
  //     <div className="p-6">
  //       <LoadingOverlay />
  //     </div>
  //   );
  // }

  return (
    <>
      <DataTable
        title="Faturalar"
        addButtonText="Fatura Ekle"
        addButtonColor="yellow"
        columns={columns}
        data={currentFaturalar}
        searchPlaceholder="Fatura No veya Müşteri Giriniz..."
        onAdd={handleAddFatura}
        onEdit={handleEditFatura}
        onDelete={handleDeleteFatura}
        onSearch={handleSearch}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalItems={filteredFaturalar.length}
        onPageChange={handlePageChange}
        customButtons={customButtons}
        headerColor="gray-800"
        headerTextColor="white"
        selectedItems={selectedItems}
        onSelectedItemsChange={setSelectedItems}
      />
      <InvoiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddInvoice={handleAddInvoice}
      />
      <InvoiceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedFatura(null);
        }}
        isEditMode={true}
        invoice={selectedFatura}
        onEditInvoice={handleEditSubmit}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setFaturaToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Fatura Silme"
        message={`${faturaToDelete?.name || ""} ${
          faturaToDelete?.ids?.length > 1 ? "faturalarını" : "faturasını"
        } silmek istediğinizden emin misiniz?`}
      />
    </>
  );
};

export default Faturalar;

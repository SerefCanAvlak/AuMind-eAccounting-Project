import React, { useEffect, useState } from "react";
import DataTable from "../components/Admin/data-table";
import { Info, Trash2, Download } from "lucide-react";
import LoadingOverlay from "../components/UI/Spinner/LoadingOverlay";
import InvoiceModal from "../components/UI/Modals/InvoiceModal";
import DeleteConfirmationModal from "../components/UI/Modals/DeleteConfirmationModal";
import { useToast } from "../hooks/useToast";
import {
  useGetAllInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useGenerateInvoicePdfMutation,
} from "../store/api/invoicesApi";

const Faturalar = () => {
  const [filteredFaturalar, setFilteredFaturalar] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState(null);
  const [faturaToDelete, setFaturaToDelete] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const { showToast } = useToast();

  // RTK Query hooks
  const { data: faturalar, isLoading, refetch } = useGetAllInvoicesQuery();
  const [createInvoice] = useCreateInvoiceMutation();
  const [updateInvoice] = useUpdateInvoiceMutation();
  const [deleteInvoice] = useDeleteInvoiceMutation();
  const [generatePdf] = useGenerateInvoicePdfMutation();

  const itemsPerPage = 50;

  // Faturalar için useEffect - sadece filtreleme için
  useEffect(() => {
    if (faturalar) {
      const data = faturalar.data || faturalar;
      setFilteredFaturalar(data);
    }
  }, [faturalar]);

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
      accessor: (row) => {
        const total = row.details?.reduce((acc, item) => {
          return acc + item.price * item.quantity;
        }, 0);
        return total?.toFixed(2) || "0.00";
      },
      className: "text-right font-bold",
    },
    {
      header: "KDV",
      accessor: (row) => {
        const kdv = row.details?.reduce((acc, item) => {
          return acc + item.vatRate;
        }, 0);

        return `${kdv}%`;
      },
      className: "text-right",
    },
    {
      header: "Toplam",
      accessor: "amount",
      className: "text-right",
    },
    {
      header: "PDF",
      accessor: "actions",
      render: (row) => (
        <div className="flex justify-center">
          <button
            onClick={() => handleDownloadPdf(row.id)}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md"
            title="PDF İndir"
          >
            <Download size={18} />
          </button>
        </div>
      ),
    },
  ];

  // Fatura ekleme işlemi
  const handleAddInvoice = async (formData) => {
    try {
      await createInvoice(formData).unwrap();
      setIsAddModalOpen(false);
      showToast("Fatura başarıyla oluşturuldu", "success");
      // Cache'i yenile
      refetch();
    } catch (error) {
      showToast(
        error.data?.errorMessages?.[0] ||
          "Fatura oluşturulurken bir hata oluştu",
        "error"
      );
    }
  };

  // Fatura düzenleme işlemi
  const handleEditFatura = (fatura) => {
    setSelectedFatura(fatura);
    setIsEditModalOpen(true);
  };

  // Fatura silme işlemi
  const handleDeleteFatura = (faturaId) => {
    if (Array.isArray(faturaId)) {
      // Toplu silme
      console.log("id", faturaId);
      setFaturaToDelete({ ids: faturaId, name: `${faturaId.length} fatura` });
    } else {
      // Tekli silme
      const fatura = faturalar.data?.find((f) => f.id === faturaId);
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
            await deleteInvoice(id).unwrap();
          }
          showToast(
            `${faturaToDelete.ids.length} fatura başarıyla silindi`,
            "success"
          );
        } else {
          // Tekli silme
          await deleteInvoice(faturaToDelete.ids).unwrap();
          showToast(
            `${faturaToDelete.name} fatura başarıyla silindi`,
            "success"
          );
        }
        // Cache'i yenile ve seçili öğeleri sıfırla
        refetch();
        setSelectedItems([]); // Seçili öğeleri sıfırla
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

  // Fatura güncelleme işlemi
  const handleEditSubmit = async (invoiceData) => {
    try {
      await updateInvoice({ id: selectedFatura.id, ...invoiceData }).unwrap();
      showToast("Fatura başarıyla güncellendi", "success");
      setIsEditModalOpen(false);
      setSelectedFatura(null);
      // Cache'i yenile
      refetch();
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
    if (!faturalar) return;
    
    const data = faturalar.data || faturalar;
    if (searchTerm.trim() === "") {
      setFilteredFaturalar(data);
    } else {
      const searchTermLower = searchTerm.toLowerCase().trim();
      const filtered = data.filter(
        (fatura) =>
          (fatura.invoiceNumber?.toLowerCase() || "").includes(
            searchTermLower
          ) ||
          (fatura.customer?.name?.toLowerCase() || "").includes(
            searchTermLower
          ) ||
          (fatura.customer?.companyName?.toLowerCase() || "").includes(
            searchTermLower
          )
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

  const handleDownloadPdf = async (invoiceId) => {
    try {
      const response = await generatePdf(invoiceId).unwrap();
      console.log("response", response);
      // Create a URL for the blob
      const url = window.URL.createObjectURL(response);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast("PDF başarıyla indirildi", "success");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast(error.message || "PDF oluşturulurken bir hata oluştu", "error");
    }
  };

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <>
      <DataTable
        title="Faturalar"
        addButtonText="Fatura Ekle"
        addButtonColor="yellow"
        columns={columns}
        data={currentFaturalar}
        searchPlaceholder="Fatura No veya Müşteri Giriniz..."
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={handleEditFatura}
        onDelete={handleDeleteFatura}
        onSearch={handleSearch}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalItems={filteredFaturalar.length}
        onPageChange={setCurrentPage}
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

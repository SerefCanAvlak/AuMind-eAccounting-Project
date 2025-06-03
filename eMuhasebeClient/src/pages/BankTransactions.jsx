import { useState, useEffect } from "react";
import { Input } from "../components/UI/Input";
import { Button } from "../components/UI/Button";
import DataTable from "../components/Admin/cash-data-table";
import BankTransactionsModal from "../components/UI/Modals/BankTransactionsModal";
import DeleteConfirmationModal from "../components/UI/Modals/DeleteConfirmationModal";
import { Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";
import {
  useGetAllBankDetailsMutation,
  useCreateBankDetailMutation,
  useUpdateBankDetailMutation,
  useDeleteBankDetailMutation,
} from "../store/api";
import { useToast } from "../hooks/useToast";

function BankTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [bankData, setBankData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bankName, setBankName] = useState(useParams().bankName);
  const [name, setName] = useState("");
  const { showToast } = useToast();

  // RTK Query hooks
  const [getAllBankDetails] = useGetAllBankDetailsMutation();
  const [createBankDetail] = useCreateBankDetailMutation();
  const [updateBankDetail] = useUpdateBankDetailMutation();
  const [deleteBankDetail] = useDeleteBankDetailMutation();

  const itemsPerPage = 50;

  // Kasa hareketleri sütun tanımları
  const columns = [
    {
      header: "# Numara",
      accessor: "id",
      className: "w-24 font-bold text-yellow-500",
    },
    { header: "Tarih", accessor: "date" },
    { header: "Açıklama", accessor: "description" },
    {
      header: "Giriş",
      accessor: "depositAmount",
      className: "text-right text-green-600 font-medium",
    },
    {
      header: "Çıkış",
      accessor: "withdrawalAmount",
      className: "text-right text-red-600 font-medium",
    },
  ];

  const fetchData = async () => {
    try {
      const response = await getAllBankDetails({
        bankId: bankName,
        startDate: "2024-05-05",
        endDate: "2026-05-30",
      }).unwrap();
      console.log(response);
      setBankData(response.data);
      setTransactions(response.data.details);
      setFilteredTransactions(response.data.details);
      setBankName(response.data.id);
      setName(response.data?.name);

      setIsLoading(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [getAllBankDetails]);

  // Sayfalama işlemleri
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= Math.ceil(filteredTransactions.length / itemsPerPage)
    ) {
      setCurrentPage(newPage);
    }
  };

  // Arama işlemi
  const handleSearch = (searchTerm) => {
    if (searchTerm.trim() === "") {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter((transaction) =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTransactions(filtered);
      setCurrentPage(1); // Arama yapıldığında ilk sayfaya dön
    }
  };

  // Tarih filtresi uygulama
  const handleApplyFilter = async () => {
    try {
      setIsLoading(true);
      const response = await getAllBankDetails({
        bankId: bankName,
        startDate: startDate || null,
        endDate: endDate || null,
      }).unwrap();

      if (response?.isSuccessful) {
        const details = response.data?.details || [];
        setTransactions(details);
        setFilteredTransactions(details);
        showToast("Tarih filtresi başarıyla uygulandı", "success");
      }
    } catch (error) {
      console.error("Error applying date filter:", error);
      showToast("Tarih filtresi uygulanırken bir hata oluştu", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // İşlem ekleme işlemi
  const handleAddTransaction = () => {
    setIsAddModalOpen(true);
  };

  // İşlem düzenleme işlemi
  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleAddBankTransaction = async (transactionData) => {
    try {
      setIsLoading(true);
      // Prepare the data with proper null handling for opposite IDs
      const transactionPayload = {
        ...transactionData,
        oppositeBankId: transactionData.oppositeBankId || null,
        oppositeCashRegisterId: transactionData.oppositeCashRegisterId || null,
        oppositeCustomerId: transactionData.oppositeCustomerId || null,
      };

      const response = await createBankDetail(transactionPayload)
      .unwrap()
      .then((res) => {
        showToast("İşlem başarıyla eklendi", "success");
        setIsAddModalOpen(false);
        setIsLoading(false);
        fetchData();
      })
      .catch((error) => {
        showToast(error.data.message, "error");
      });
      
    } catch (error) {
      console.error("İşlem ekleme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };
  console.log(selectedTransaction);
  const handleUpdateBankTransaction = async (transactionData) => {
    try {
      setIsLoading(true);

      // Prepare the data with proper null handling for opposite IDs
      const transactionPayload = {
        ...transactionData,
        id: selectedTransaction.id,
        bankId: selectedTransaction.bankId,
        type: selectedTransaction.depositAmount === 0 ? 1 : 0,
      };

      const response = await updateBankDetail(transactionPayload)
      .unwrap()
      .then((res) => {
        showToast("İşlem başarıyla güncellendi", "success");
        setIsEditModalOpen(false);
        setIsLoading(false);
        fetchData();
      })
      .catch((error) => {
        showToast(error.data.message, "error");
      });
      
      
    } catch (error) {
      console.error("İşlem güncelleme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // İşlem silme işlemi
  const handleDeleteTransaction = (transactionId) => {
    if (Array.isArray(transactionId)) {
      // Toplu silme
      setTransactionToDelete({
        ids: transactionId,
        name: `${transactionId.length} işlem`,
      });
    } else {
      // Tekli silme
      const transaction = transactions.find((t) => t.id === transactionId);
      setTransactionToDelete({
        ids: [transactionId],
        name: `#${transaction.id} numaralı işlem`,
      });
    }
    setIsDeleteModalOpen(true);
  };

  // Silme onaylama işlemi
  const confirmDelete = async () => {
    if (transactionToDelete) {
      if (transactionToDelete) {
        try {
          if (Array.isArray(transactionToDelete.ids)) {
            // Toplu silme
            for (const id of transactionToDelete.ids) {
              await deleteBankDetail(id);
            }
            showToast(
              `${transactionToDelete.ids.length} işlem başarıyla silindi`,
              "success"
            );
          } else {
            // Tekli silme
            await deleteBankDetail(transactionToDelete.ids);
            showToast(
              `${transactionToDelete.name} işlem başarıyla silindi`,
              "success"
            );
          }
          // Update the currents state to remove deleted items
          const updatedCurrents = transactions.filter(
            (cash) => !transactionToDelete.ids.includes(cash.id)
          );
          setTransactions(updatedCurrents);
          setFilteredTransactions(updatedCurrents);
        } catch (error) {
          console.error("Error deleting cash register:", error);
          showToast("Kasa silinirken bir hata oluştu", "error");
        }
        setIsDeleteModalOpen(false);
        setTransactionToDelete(null);
      }
    }
  };

  // Geçerli sayfadaki işlemleri hesapla
  const currentTransactions = Array.isArray(filteredTransactions)
    ? filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : [];

  // Özel filtre bileşeni
  const customFilters = (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="pl-3 text-lg py-2 border bg-white border-gray-300 rounded-md"
          placeholder="Başlangıç tarihi giriniz..."
        />
      </div>

      <div className="relative">
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="pl-3 text-lg py-2 border bg-white border-gray-300 rounded-md"
          placeholder="Bitiş tarihi giriniz..."
        />
      </div>

      <Button
        onClick={handleApplyFilter}
        className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-medium py-2 px-4 rounded-md"
      >
        Getir
      </Button>
    </div>
  );

  // Özel başlık bileşeni
  const customHeader = (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold border-b-2 border-gray-300 text-gray-800">
        <span className="text-yellow-500">{name}</span> Banka Hareketleri
      </h1>
    </div>
  );

  // Özel butonlar
  const customButtons = selectedItems.length > 0 && (
    <button
      onClick={() => handleDeleteTransaction(selectedItems)}
      className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 ml-5 rounded-md flex items-center"
    >
      <Trash2 size={18} className="mr-2" />
      Seçilenleri Sil ({selectedItems.length})
    </button>
  );

  console.log("selectedItems", selectedItems);

  return (
    <>
      <div className="p-6 bg-gray-100 min-h-screen">
        {/* Özel başlık */}
        {customHeader}

        <DataTable
          title=""
          addButtonText="İşlem Ekle"
          addButtonColor="yellow"
          columns={columns}
          data={currentTransactions}
          searchPlaceholder="Açıklama Arayınız..."
          onAdd={handleAddTransaction}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          onSearch={handleSearch}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          totalItems={filteredTransactions.length}
          onPageChange={handlePageChange}
          isLoading={isLoading}
          customFilters={customFilters}
          customButtons={customButtons}
          hideTitle={true}
          headerColor="gray-800"
          headerTextColor="white"
          selectedItems={selectedItems}
          onSelectedItemsChange={setSelectedItems}
        />
      </div>

      <BankTransactionsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddBankTransaction}
        bankData={bankData}
      />
      <BankTransactionsModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTransaction(null);
        }}
        isEditMode={true}
        transaction={selectedTransaction}
        onAddTransaction={(data) => {
          console.log("Düzenlenen işlem:", data);
          setIsEditModalOpen(false);
          setSelectedTransaction(null);
        }}
        onUpdateTransaction={handleUpdateBankTransaction}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTransactionToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="İşlem Silme"
        message={`${transactionToDelete?.name || ""} ${
          transactionToDelete?.ids?.length > 1 ? "işlemlerini" : "işlemini"
        } silmek istediğinizden emin misiniz?`}
      />
    </>
  );
}

export default BankTransactions;

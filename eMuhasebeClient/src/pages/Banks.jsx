import { Info, Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import BankAddModal from "../components/UI/Modals/BankModal";
import { useNavigate } from "react-router-dom";
import { useGetAllBanksMutation, useCreateBankMutation, useUpdateBankMutation, useDeleteBankMutation } from "../store/api";
import { useToast } from "../hooks/useToast";

function Banks() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [banks, setBanks] = useState([]);
  const navigate = useNavigate();
  const [getAllBanks] = useGetAllBanksMutation();
  const [createBank] = useCreateBankMutation();
  const [updateBank] = useUpdateBankMutation();
  const [deleteBank] = useDeleteBankMutation();

  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAllBanks();
        setBanks(response.data.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const handleAddBank = async (bankData) => {
    await createBank(bankData)
      .unwrap()
      .then(() => {
        showToast("Banka başarıyla eklendi!", "success");
        setIsAddModalOpen(false);
        fetchData(); // Refresh the list
      })
      .catch((error) => {
        showToast(error.data.message, "error");
      });
  };

  const handleUpdateBank = async (bankData) => {
    await updateBank(bankData)
      .unwrap()
      .then(() => {
        showToast("Banka başarıyla güncellendi!", "success");
        setIsEditModalOpen(false);
        setSelectedBank(null);
        fetchData(); // Refresh the list
      })
      .catch((error) => {
        showToast(error.data.message, "error");
      });
  };

  const handleDeleteBank = async () => {
    if (!selectedBank) return;
    
    await deleteBank(selectedBank.id)
      .unwrap()
      .then(() => {
        showToast("Banka başarıyla silindi!", "success");
        setIsDeleteModalOpen(false);
        setSelectedBank(null);
        fetchData(); // Refresh the list
      })
      .catch((error) => {
        showToast(error.data.message, "error");
      });
  };

  const fetchData = async () => {
    try {
      const response = await getAllBanks();
      setBanks(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Para birimi sembolünü al
  const getCurrencySymbol = (currencyType) => {
   
    
    // currencyType.name'e göre sembol belirle
    switch (currencyType?.name?.toUpperCase()) {
      case 'USD':
      case 'DOLAR':
        return '$';
      case 'EUR':
      case 'EURO':
        return '€';
      case 'TRY':
      case 'TL':
      case 'TÜRK LİRASI':
      default:
        return '₺';
    }
  };

  // Para birimi formatla
  const formatCurrency = (amount, currencyType) => {
   
    
    const currencySymbol = getCurrencySymbol(currencyType);
    
    try {
      // Mutlak değer kullanarak eksi işaretini kaldır
      const absoluteAmount = Math.abs(amount);
      
      // Özel formatlama için NumberFormat kullan
      const formattedNumber = new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(absoluteAmount);

      // Para birimi sembolünü ekle
      return `${currencySymbol}${formattedNumber}`;
    } catch (error) {
      console.warn('Para birimi formatlama hatası:', error);
      const absoluteAmount = Math.abs(amount);
      return `${currencySymbol}${absoluteAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Başlık */}
      <div className="flex items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Bankalar</h1>
        <Info className="ml-2 h-5 w-5 text-gray-500" />
      </div>

      {/* Banka Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Mevcut Banka Kartları */}
        {banks.map((bank) => {
          
          
          return (
            <div key={bank.id} className="bg-gray-700 rounded-lg p-6 text-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{bank.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedBank(bank);
                      setIsEditModalOpen(true);
                    }}
                    className="p-1 hover:bg-gray-600 rounded transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBank(bank);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1 hover:bg-gray-600 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="w-full h-0.5 bg-white mb-4"></div>

              <div className="text-center mb-4">
                <p className="text-gray-300">Iban Numarası</p>
                <p className="font-medium">{bank.iban}</p>
              </div>

              <div className="text-center mb-4">
                <p className="text-gray-300">Döviz Tipi</p>
                <p className="font-medium">{bank.currencyType.name}</p>
              </div>

              <div className="flex justify-between mb-4">
                <div className="text-center">
                  <p className="text-gray-300">Giriş</p>
                  <p className="font-medium">{formatCurrency(bank.depositAmount || 0, bank.currencyType)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-300">Çıkış</p>
                  <p className="font-medium">{formatCurrency(bank.withdrawalAmount || 0, bank.currencyType)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-300">Bakiye</p>
                  <p className="font-medium">{formatCurrency((bank.depositAmount || 0) - (bank.withdrawalAmount || 0), bank.currencyType)}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  navigate(`/bank-transactions/${bank.id}`);
                }}
                className="w-full bg-white text-gray-800 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors"
              >
                Detaylar
              </button>
            </div>
          );
        })}

        {/* Yeni Banka Ekleme Kartı */}
        <div
          className="bg-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsAddModalOpen(true)}
        >
          <div className="p-6 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Banka Ekleme Modalı */}
      <BankAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        createBank={handleAddBank}
      />

      {/* Banka Düzenleme Modalı */}
      {selectedBank && (
        <BankAddModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedBank(null);
          }}
          createBank={handleUpdateBank}
          bank={selectedBank}
          isEdit={true}
        />
      )}

      {/* Silme Onay Modalı */}
      {isDeleteModalOpen && selectedBank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Banka Silme Onayı</h3>
            <p className="mb-6">
              <span className="font-medium">{selectedBank.name}</span> bankasını silmek istediğinizden emin misiniz?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedBank(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteBank}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Banks;

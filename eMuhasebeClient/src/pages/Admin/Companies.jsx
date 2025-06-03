import { useState, useEffect } from "react";
import DataTable from "../../components/Admin/data-table";
import { RefreshCw } from "lucide-react";
import LoadingOverlay from "../../components/UI/Spinner/LoadingOverlay";
import CompanyModal from "../../components/UI/Modals/CompanyModal";
import DeleteConfirmationModal from "../../components/UI/Modals/DeleteConfirmationModal";
import { Trash2 } from "lucide-react";
import {
  useGetAllCompaniesMutation,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
  useMigrateAllCompaniesMutation,
} from "../../store/api/companiesApi";
import { useToast } from "../../hooks/useToast";
import { useDispatch, useSelector } from "react-redux";
import {
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDeleteModal,
  closeDeleteModal,
} from "../../store/slices/modalSlice";

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const { showToast } = useToast();

  // Redux hooks
  const dispatch = useDispatch();
  const { isAddModalOpen, isEditModalOpen, isDeleteModalOpen } = useSelector(
    (state) => state.modal
  );

  // RTK Query hooks
  const [getAllCompanies, { isLoading: isCompaniesLoading }] =
    useGetAllCompaniesMutation();
  const [createCompany] = useCreateCompanyMutation();
  const [updateCompany] = useUpdateCompanyMutation();
  const [deleteCompany] = useDeleteCompanyMutation();
  const [migrateAllCompanies] = useMigrateAllCompaniesMutation();

  const itemsPerPage = 50;

  // Şirket sütun tanımları
  const columns = [
    {
      header: "# Numara",
      accessor: "id",
      className: "w-24 font-bold text-yellow-500",
    },
    { header: "Şirket Adı", accessor: "name" },
    { header: "Adres", accessor: "fullAdress" },
    { header: "Vergi Dairesi", accessor: "taxDepartment" },
    { header: "Vergi Numarası", accessor: "taxNumber" },
    { header: "Server", accessor: "database.server" },
    { header: "Veritabanı Adı", accessor: "database.databaseName" },
    { header: "Yönetici Adı", accessor: "database.adminName" },
  ];

  const fetchData = async () => {
    try {
      const result = await getAllCompanies().unwrap();
      console.log(result);
      if (result?.isSuccessful) {
        const formattedData = Array.isArray(result.data) ? result.data : [];
        setCompanies(formattedData);
        setFilteredCompanies(formattedData);
      } else {
        console.error("Error fetching users:", result?.errorMessages);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // Şirketler için useEffect
  useEffect(() => {
    fetchData();
  }, [getAllCompanies]);

  // Sayfalama işlemleri
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= Math.ceil(filteredCompanies.length / itemsPerPage)
    ) {
      setCurrentPage(newPage);
    }
  };

  // Arama işlemi
  const handleSearch = (searchTerm) => {
    if (searchTerm.trim() === "") {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(
        (company) =>
          company.name
            .toLowerCase()
            .trim()
            .includes(searchTerm.toLowerCase().trim()) ||
          company.taxNumber
            .toLowerCase()
            .trim()
            .includes(searchTerm.toLowerCase().trim())
      );
      setFilteredCompanies(filtered);
      setCurrentPage(1); // Arama yapıldığında ilk sayfaya dön
    }
  };

  // Şirket ekleme işlemi
  const handleAddCompany = () => {
    dispatch(openAddModal());
  };

  // Database güncelleme işlemi
  const handleUpdateDatabase = async () => {
    console.log("Database güncelleniyor...");
    try {
      const result = await migrateAllCompanies().unwrap();
      showToast(`${result.data}`, "success");
    } catch (error) {
      console.error("Database güncelleme hatası:", error);
    }
  };

  // Şirket düzenleme işlemi
  const handleEditCompany = (company) => {
    console.log("Düzenlenecek şirket:", company);
    dispatch(openEditModal());
    setSelectedCompany(company); // Düzenlenecek şirket bilgilerini ayarla
  };

  // Şirket silme işlemi
  const handleDeleteCompany = (companyId) => {
    if (Array.isArray(companyId)) {
      // Toplu silme
      setCompanyToDelete({
        ids: companyId,
        name: `${companyId.length} şirket`,
      });
    } else {
      // Tekli silme
      const company = companies.find((c) => c.id === companyId);
      setCompanyToDelete({ ids: [companyId], name: company.name });
    }
    dispatch(openDeleteModal());
  };

  const confirmDelete = async () => {
    if (companyToDelete) {
      try {
        // Toplu silme işlemi
        for (const id of companyToDelete.ids) {
          await deleteCompany(id).unwrap();
        }

        showToast("Şirketler başarıyla silindi", "success");

        // Şirket listesini yenile
        const result = await getAllCompanies().unwrap();

        if (result?.isSuccessful) {
          const formattedData = Array.isArray(result.data) ? result.data : [];
          console.log(formattedData);
          setCompanies(formattedData);
          setFilteredCompanies(formattedData);
        }
        await getAllCompanies().unwrap();

        setSelectedItems([]); // Seçili öğeleri temizle
        dispatch(closeDeleteModal());
        setCompanyToDelete(null);
      } catch (err) {
        console.error("Error deleting company:", err);
        showToast(
          err.data?.errorMessages?.[0] || "Şirket silinirken bir hata oluştu",
          "error"
        );
      }
    }
  };

  const handleCompanySubmit = async (companyData) => {
    await createCompany(companyData)
      .unwrap()
      .then(() => {
        showToast("Şirket başarıyla oluşturuldu", "success");
        dispatch(closeAddModal());
        fetchData();
      })
      .catch((err) => {
        showToast(err.data?.errorMessages?.[0], "error");
      });
  };

  const handleEditSubmit = async (companyData) => {
    await updateCompany({ id: selectedCompany.id, ...companyData })
      .unwrap()
      .then(() => {
        showToast("Şirket başarıyla güncellendi", "success");
        dispatch(closeEditModal());
        setSelectedCompany(null);
        fetchData();
      })
      .catch((err) => {
        showToast(err.data?.errorMessages?.[0], "error");
      });
  };

  // Geçerli sayfadaki şirketleri hesapla
  const currentCompanies = filteredCompanies
    .map((company) => ({
      ...company,
      database: company.database || {},
    }))
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Özel butonlar
  const customButtons = (
    <div className="flex items-center">
      <button
        onClick={handleUpdateDatabase}
        className="bg-yellow-300 hover:bg-yellow-400 text-gray-800 font-medium py-2 px-4 rounded-md flex items-center mr-4"
      >
        <RefreshCw size={18} className="mr-2" />
        Database Güncelle
      </button>
      {selectedItems.length > 0 && (
        <button
          onClick={() => handleDeleteCompany(selectedItems)}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md flex items-center"
        >
          <Trash2 size={18} className="mr-2" />
          Seçilenleri Sil ({selectedItems.length})
        </button>
      )}
    </div>
  );

  if (isCompaniesLoading) {
    return (
      <div className="p-6">
        <LoadingOverlay />
      </div>
    );
  }

  return (
    <>
      <DataTable
        title="Şirketler"
        addButtonText="Şirket Ekle"
        addButtonColor="yellow"
        columns={columns}
        data={currentCompanies}
        searchPlaceholder="Şirket Adı Giriniz..."
        onAdd={handleAddCompany}
        onEdit={handleEditCompany}
        onDelete={handleDeleteCompany}
        onSearch={handleSearch}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalItems={filteredCompanies.length}
        onPageChange={handlePageChange}
        customButtons={customButtons}
        headerColor="gray-800"
        headerTextColor="white"
        selectedItems={selectedItems}
        onSelectedItemsChange={setSelectedItems}
      />
      <CompanyModal
        isOpen={isAddModalOpen}
        onClose={() => dispatch(closeAddModal())}
        onSubmit={handleCompanySubmit}
      />
      <CompanyModal
        isOpen={isEditModalOpen}
        onClose={() => {
          dispatch(closeEditModal());
          setSelectedCompany(null); // Modal kapandığında seçili şirketi sıfırla
        }}
        isEditMode={true} // Düzenleme modunda aç
        company={selectedCompany} // Düzenlenecek şirket bilgileri
        onSubmit={handleEditSubmit}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          dispatch(closeDeleteModal());
          setCompanyToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Şirket Silme"
        message={`${companyToDelete?.name || ""} ${
          companyToDelete?.ids?.length > 1 ? "şirketlerini" : "şirketini"
        } silmek istediğinizden emin misiniz?`}
      />
    </>
  );
}

export default Companies;

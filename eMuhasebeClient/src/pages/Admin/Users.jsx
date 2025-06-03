import { useState, useEffect } from "react";
import DataTable from "../../components/Admin/data-table";
import UserModal from "../../components/UI/Modals/UserModal";
import DeleteConfirmationModal from "../../components/UI/Modals/DeleteConfirmationModal";
import { Trash2 } from "lucide-react";
import {
  useGetAllUsersMutation,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "../../store/api/usersApi";
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
import LoadingOverlay from "../../components/UI/Spinner/LoadingOverlay";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast } = useToast();

  // Redux hooks
  const dispatch = useDispatch();
  const { isAddModalOpen, isEditModalOpen, isDeleteModalOpen } = useSelector(
    (state) => state.modal
  );

  // RTK Query hooks
  const [getAllUsers, { data, isUsersLoading, error }] =
    useGetAllUsersMutation();
  const [createUser, { isLoading: isCreatingUser }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();

  const fetchData = async () => {
    try {
      const result = await getAllUsers().unwrap();
      if (result?.isSuccessful) {
        const formattedData = Array.isArray(result.data) ? result.data : [];
        setUsers(formattedData);
        setFilteredUsers(formattedData);
      } else {
        console.error("Error fetching users:", result?.errorMessages);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [getAllUsers]);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm]);

  const itemsPerPage = 50;

  // Kullanıcı sütun tanımları
  const columns = [
    {
      header: "# Numara",
      accessor: "id",
      className: "w-24 font-bold text-yellow-500",
    },
    { header: "Kullanıcı Adı", accessor: "firstName" },
    { header: "Kullanıcı Soyadı", accessor: "lastName" },
    { header: "E-Mail Adresi", accessor: "email" },
    {
      header: "Bağlı Olduğu Şirketler",
      accessor: "companyUsers",
      Cell: ({ value }) => {
        if (!value) return "-";
        if (Array.isArray(value)) {
          const companyNames = value
            .map((cu) => cu.company?.name)
            .filter(Boolean);
          return companyNames.length > 0 ? companyNames.join(", ") : "-";
        }
        return value.company?.name || "-";
      },
    },
    { header: "Username", accessor: "userName" },
  ];

  // Sayfalama işlemleri
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= Math.ceil(filteredUsers.length / itemsPerPage)
    ) {
      setCurrentPage(newPage);
    }
  };

  // Arama işlemi
  const handleSearch = (searchTerm) => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.firstName
            .toLowerCase()
            .trim()
            .includes(searchTerm.toLowerCase().trim()) ||
          user.lastName
            .toLowerCase()
            .trim()
            .includes(searchTerm.toLowerCase().trim()) ||
          user.email
            .toLowerCase()
            .trim()
            .includes(searchTerm.toLowerCase().trim())
      );
      setFilteredUsers(filtered);
      setCurrentPage(1); // Arama yapıldığında ilk sayfaya dön
    }
  };

  // Kullanıcı ekleme modalını aç
  const handleAddUser = () => {
    dispatch(openAddModal());
  };

  // Kullanıcı oluşturma işlemi
  const handleUserSubmit = async (userData) => {
    await createUser(userData)
      .unwrap()
      .then(() => {
        showToast("Kullanıcı başarıyla oluşturuldu", "success");
        dispatch(closeAddModal());
        fetchData();
      })
      .catch((err) => {
        showToast(err.data?.errorMessages?.[0], "error");
      });
  };
  const handleEditSubmit = async (userData, userId) => {
    await updateUser({
      id: userId,
      ...userData,
    })
      .unwrap()
      .then(() => {
        showToast("Kullanıcı başarıyla güncellendi", "success");
        dispatch(closeEditModal());
        setSelectedUser(null);
        fetchData();
      })
      .catch((err) => {
        showToast(err.data?.errorMessages?.[0], "error");
      });
  };

  // Kullanıcı düzenleme işlemi
  const handleEditUser = (user) => {
    setSelectedUser(user);
    dispatch(openEditModal());
  };

  // Kullanıcı silme işlemi
  const handleDeleteUser = (userId) => {
    if (Array.isArray(userId)) {
      // Toplu silme
      setUserToDelete({ ids: userId, name: `${userId.length} kullanıcı` });
    } else {
      // Tekli silme
      const user = users.find((u) => u.id === userId);
      setUserToDelete({ ids: [userId], name: user.firstName });
    }
    dispatch(openDeleteModal());
  };

  // Silme onaylama işlemi
  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        // Toplu silme işlemi
        for (const id of userToDelete.ids) {
          await deleteUser(id).unwrap();
        }

        showToast("Kullanıcılar başarıyla silindi", "success");

        // Kullanıcı listesini yenile
        const result = await getAllUsers().unwrap();

        if (result?.isSuccessful) {
          console.log("sffss");
          const formattedData = Array.isArray(result.data) ? result.data : [];
          setUsers(formattedData);
          setFilteredUsers(formattedData);
        }

        setSelectedItems([]); // Seçili öğeleri temizle
        dispatch(closeDeleteModal());
        setUserToDelete(null);
      } catch (err) {
        console.error("Error deleting user:", err);
        showToast(
          err.data?.errorMessages?.[0] ||
            "Kullanıcı silinirken bir hata oluştu",
          "error"
        );
      }
    }
  };

  // Geçerli sayfadaki kullanıcıları hesapla
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Özel butonlar
  const customButtons = selectedItems.length > 0 && (
    <button
      onClick={() => handleDeleteUser(selectedItems)}
      className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md flex items-center"
    >
      <Trash2 size={18} className="mr-2" />
      Seçilenleri Sil ({selectedItems.length})
    </button>
  );

  if (isUsersLoading || isCreatingUser || isUpdatingUser) {
    return (
      <div className="p-6">
        <LoadingOverlay />
      </div>
    );
  }

  return (
    <>
      <DataTable
        title="Kullanıcılar"
        addButtonText="Kullanıcı Ekle"
        addButtonColor="yellow"
        columns={columns}
        data={currentUsers}
        searchPlaceholder="İsim Giriniz..."
        onAdd={handleAddUser}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onSearch={handleSearch}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalItems={filteredUsers.length}
        onPageChange={handlePageChange}
        customButtons={customButtons}
        headerColor="gray-800"
        headerTextColor="white"
        selectedItems={selectedItems}
        onSelectedItemsChange={setSelectedItems}
      />
      <UserModal
        isOpen={isAddModalOpen}
        onClose={() => dispatch(closeAddModal())}
        onSubmit={handleUserSubmit}
      />
      <UserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          dispatch(closeEditModal());
          setSelectedUser(null);
        }}
        isEditMode={true}
        user={selectedUser}
        onEditSubmit={handleEditSubmit}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          dispatch(closeDeleteModal());
          setUserToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Kullanıcı Silme"
        message={`${userToDelete?.name || ""} ${
          userToDelete?.ids?.length > 1 ? "kullanıcılarını" : "kullanıcısını"
        } silmek istediğinizden emin misiniz?`}
      />
    </>
  );
}

export default UsersPage;

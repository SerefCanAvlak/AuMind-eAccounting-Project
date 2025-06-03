import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/Admin/data-table";
import { Info, Trash2 } from "lucide-react";
import LoadingOverlay from "../components/UI/Spinner/LoadingOverlay";
import ProductModal from "../components/UI/Modals/ProductModal";
import DeleteConfirmationModal from "../components/UI/Modals/DeleteConfirmationModal";
import {
  useGetAllProductsMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "../store/api";
import { useToast } from "../hooks/useToast";

const Products = () => {
  const navigate = useNavigate();
  const [currents, setCurrents] = useState([]);
  const [filteredCurrents, setFilteredCurrents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const { showToast } = useToast();

  // RTK Query Hooks
  const [getAllProducts, { isLoading: isLoadingProducts }] =
    useGetAllProductsMutation();
  const [createProduct, { isLoading: isCreatingProduct }] =
    useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdatingProduct }] =
    useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeletingProduct }] =
    useDeleteProductMutation();

  // Sayfa başına gösterilecek ürün sayısı
  const itemsPerPage = 50;

  // Detay butonu render fonksiyonu
  const renderDetailButton = (product) => (
    <div className="flex justify-end mr-5">
      <button
        onClick={() => navigate(`/product-detail/${product.id}`)}
        className="bg-yellow-300 hover:bg-yellow-400 text-gray-800 font-medium py-1 px-3 rounded-md flex items-center"
      >
        <Info size={16} className="mr-1" />
        Detay Gör
      </button>
    </div>
  );

  // Ürünler tablosu sütun tanımları
  const columns = [
    {
      header: "# Numara",
      accessor: "id",
      className: "w-24 font-bold text-yellow-500",
    },
    { header: "Ürün Adı", accessor: "name" },
    { header: "Giriş", accessor: "deposit", className: "text-green-600" },
    { header: "Çıkış", accessor: "withdrawal", className: "text-red-600" },
    {
      header: "Bakiye",
      accessor: (row) => (row.deposit - row.withdrawal).toFixed(2),
      className: "text-blue-600",
    },
    {
      header: "İşlemler",
      accessor: "actions",

      render: renderDetailButton,
    },
  ];
  const fetchData = async () => {
    try {
      const result = await getAllProducts().unwrap();
      console.log("API Response:", result); // API yanıtını kontrol et
      const productArray = Array.isArray(result.data) ? result.data : [];
      console.log("Product Array:", productArray); // Ürün array'ini kontrol et
      setCurrents(productArray);
      setFilteredCurrents(productArray);
    } catch (error) {
      console.error("Error fetching products:", error);
      setCurrents([]);
      setFilteredCurrents([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [getAllProducts]);

  // Sayfalama işlemleri
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= Math.ceil(filteredCurrents.length / itemsPerPage)
    ) {
      setCurrentPage(newPage);
    }
  };

  // Ürün ekleme işlemi
  const handleAddProduct = () => {
    setIsAddModalOpen(true);
  };

  // Ürün düzenleme işlemi
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    console.log(product);
    setIsEditModalOpen(true);
  };

  // Ürün ekleme işlemi
  const handleAddSubmit = async (product) => {
    const result = await createProduct(product)
      .unwrap()
      .then((res) => {
        setIsAddModalOpen(false);
        setSelectedProduct(null);
        showToast("Ürün başarıyla eklendi", "success");
        fetchData();
      })
      .catch((err) => {
        showToast(err.data.message, "error");
      });
  };

  const handleEditSubmit = async (product) => {
    const result = await updateProduct({
      id: selectedProduct.id,
      ...product,
    }).unwrap().then((res) => {
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      showToast("Ürün başarıyla güncellendi", "success");
      fetchData();
    }).catch((err) => {
      showToast(err.data.message, "error");
    });
    
  };  

  // Ürün silme işlemi
  const handleDeleteProduct = (productId) => {
    console.log(productId);
    if (Array.isArray(productId)) {
      // Toplu silme
      setProductToDelete({ ids: productId, name: `${productId.length} ürün` });
    } else {
      // Tekli silme
      const product = currents.find((c) => c.id === productId);
      setProductToDelete({ ids: [productId], name: product.name });
    }
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        if (Array.isArray(productToDelete.ids)) {
          // Toplu silme
          for (const id of productToDelete.ids) {
            await deleteProduct(id);
          }
          showToast(
            `${productToDelete.ids.length} ürün başarıyla silindi`,
            "success"
          );
        } else {
          // Tekli silme
          await deleteProduct(productToDelete.ids);
          showToast(
            `${productToDelete.name} ürün başarıyla silindi`,
            "success"
          );
        }
        // Update the currents state to remove deleted items
        const updatedCurrents = currents.filter(
          (product) => !productToDelete.ids.includes(product.id)
        );
        setCurrents(updatedCurrents);
        setFilteredCurrents(updatedCurrents);
        // Clear selected items after deletion
        setSelectedItems([]);
      } catch (error) {
        console.error("Error deleting product:", error);
        showToast("Ürün silinirken bir hata oluştu", "error");
      }
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  // Ürün arama işlemi
  const handleSearch = (searchTerm) => {
    console.log(searchTerm);
    console.log("currents array:", currents); // Debug için currents array'ini kontrol et
    const filteredProducts = currents.filter((product) =>
      product.name
        .toLowerCase()
        .trim()
        .includes(searchTerm.toLowerCase().trim())
    );

    console.log("filteredProducts", filteredProducts);
    setFilteredCurrents(filteredProducts);
    setCurrentPage(1);
  };

  // Özel butonlar
  const customButtons = (
    <>
      {selectedItems.length > 0 && (
        <button
          onClick={() => handleDeleteProduct(selectedItems)}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md flex items-center"
        >
          <Trash2 size={18} className="mr-2" />
          Seçilenleri Sil ({selectedItems.length})
        </button>
      )}
    </>
  );

  // Sayfa başına listeleme işlemi
  const currentProducts = Array.isArray(filteredCurrents)
    ? filteredCurrents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : [];

  return (
    <>
      <DataTable
        title="Ürünler"
        addButtonText="Ürün Ekle"
        addButtonColor="yellow"
        columns={columns}
        data={currentProducts}
        searchPlaceholder="Ürün Adı Giriniz..."
        onAdd={handleAddProduct}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
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
      <ProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleAddSubmit}
      />
      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
        isEditMode={true}
        onEditProduct={handleEditSubmit}
        product={selectedProduct}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Ürün Silme"
        message={`${productToDelete?.name || ""} ${
          productToDelete?.ids?.length > 1 ? "ürünlerini" : "ürünü"
        } silmek istediğinizden emin misiniz?`}
      />
    </>
  );
};

export default Products;

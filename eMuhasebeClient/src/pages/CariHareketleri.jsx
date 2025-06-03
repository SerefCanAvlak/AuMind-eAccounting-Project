import { useEffect, useState } from "react";
import DataTable from "../components/Admin/data-table";
import { useGetAllCustomerDetailsMutation } from "../store/api";
import { useParams } from "react-router-dom";

const CariHareketleri = () => {
  const [cariHareketleri, setCariHareketleri] = useState([]);
  const [getAllCariHareketleri, { isLoading }] =
    useGetAllCustomerDetailsMutation();

  const { id: customerId } = useParams();
  const fetchCariHareketleri = async () => {
    try {
      const response = await getAllCariHareketleri(customerId).unwrap();
      setCariHareketleri(response.data.details);
    } catch (error) {
      console.error("Error fetching cari hareketleri:", error);
    }
  };
  useEffect(() => {
    fetchCariHareketleri();
  }, [getAllCariHareketleri, customerId]);

  return (
    <DataTable
      title="Cari Hareketleri"
      columns={[
        { header: "# Numara", accessor: "id" },
        { header: "Tarih", accessor: "date" },
        { header: "Cari Tipi", accessor: "type.name" },
        { header: "Açıklama", accessor: "description" },
        { header: "Giriş", accessor: "depositAmount" },
        { header: "Çıkış", accessor: "withdrawalAmount" },
      ]}
      data={cariHareketleri}
      isLoading={isLoading}
      isCari={true} // Cari hesaplar için özel stil
    />
  );
};

export default CariHareketleri;

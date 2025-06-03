import { useEffect, useState } from "react";
import { X, Calendar, ChevronDown, Plus, Upload } from "lucide-react";
import {
  useGetAllCustomersQuery,
  useGetAllProductsMutation,
  useExtractTextMutation,
  useCreateProductMutation,
} from "../../../store/api";
import { toast } from "react-hot-toast";

// Sayı formatlama fonksiyonu
const formatNumber = (number) => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number);
};

function InvoiceModal({
  isOpen,
  isEditMode,
  invoice,
  onClose,
  onAddInvoice,
  onEditInvoice,
}) {
  const { data: customers } = useGetAllCustomersQuery();
  const [getProducts] = useGetAllProductsMutation();
  const [createProduct] = useCreateProductMutation();
  const [extractText, { isLoading: isExtracting }] = useExtractTextMutation();
  const [productsData, setProductsData] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ürünleri yükle
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('Ürünler yükleniyor...');
        const result = await getProducts().unwrap();
        console.log('API yanıtı:', result);
        
        if (!result.data || !Array.isArray(result.data)) {
          console.error('Geçersiz ürün verisi:', result);
          toast.error('Ürün verisi geçersiz format');
          return;
        }

        const products = result.data;
        console.log('Yüklenen ürünler:', products.map(p => ({ id: p.id, name: p.name })));
        
        // Ürün isimlerini normalize et ve sakla
        const normalizedProducts = products.map(p => ({
          ...p,
          normalizedName: p.name.toLowerCase().trim()
        }));
        
        console.log('Normalize edilmiş ürünler:', normalizedProducts.map(p => ({ 
          id: p.id, 
          name: p.name, 
          normalizedName: p.normalizedName 
        })));
        
        setProductsData(normalizedProducts);
      } catch (error) {
        console.error('Ürünler yüklenirken hata:', error);
        toast.error('Ürünler yüklenirken bir hata oluştu');
      }
    };

    loadProducts();
  }, [getProducts]);

  // Eksik ürünleri oluştur
  const createMissingProducts = async (productNames) => {
    if (!Array.isArray(productNames)) {
      console.error('Geçersiz ürün listesi:', productNames);
      return [];
    }

    const createdProducts = [];
    
    for (const name of productNames) {
      // Ürün adı geçerli mi kontrol et
      if (!name || typeof name !== 'string') {
        console.error('Geçersiz ürün adı:', name);
        continue;
      }

      const normalizedName = name.toLowerCase().trim();
      if (!normalizedName) {
        console.error('Boş ürün adı:', name);
        continue;
      }

      // Ürün zaten var mı kontrol et
      const existingProduct = productsData.find(
        p => p.normalizedName === normalizedName
      );
      
      if (!existingProduct) {
        try {
          console.log('Yeni ürün oluşturuluyor:', normalizedName);
          const result = await createProduct({
            name: name.trim(), // Orijinal ismi kullan, sadece başındaki ve sonundaki boşlukları temizle
            deposit: 0,
            withdrawal: 0
          }).unwrap();
          
          if (result.data) {
            const newProduct = {
              ...result.data,
              normalizedName: result.data.name.toLowerCase().trim()
            };
            createdProducts.push(newProduct);
            console.log('Ürün başarıyla oluşturuldu:', newProduct);
          }
        } catch (error) {
          console.error('Ürün oluşturulurken hata:', error);
          toast.error(`${name} ürünü oluşturulurken bir hata oluştu`);
        }
      } else {
        console.log('Ürün zaten mevcut:', existingProduct);
      }
    }
    
    if (createdProducts.length > 0) {
      // Yeni ürünleri mevcut listeye ekle
      setProductsData(prev => [...prev, ...createdProducts]);
      toast.success(`${createdProducts.length} yeni ürün oluşturuldu`);
    }
    
    return createdProducts;
  };

  const [formData, setFormData] = useState({
    typeValue: invoice?.typeValue === 2 ? "satis" : "alis",
    date: invoice?.date || new Date().toISOString().split("T")[0],
    customerId: invoice?.customerId || "",
    details: invoice?.details || [],
    vatRate: invoice?.vatRate || 0,
  });

  const [newItem, setNewItem] = useState({
    productId: "",
    quantity: "",
    price: "",
    total: "",
    vatRate: 0,
  });

  // Düzenleme modunda fatura verilerini yükle
  useEffect(() => {
    if (isEditMode && invoice) {
      // Müşteri adını bul
      const customer = customers?.data?.find(
        (c) => c.id === invoice.customerId
      );

      // Ürün detaylarını hazırla
      const details = invoice.details?.map((detail) => {
        const product = productsData.find((p) => p.id === detail.productId);
        const quantity = Number(detail.quantity) || 0;
        const price = Number(detail.price) || 0;
        const total = formatNumber(quantity * price); // Toplamı formatla

        return {
          productId: product?.name || "",
          quantity: detail.quantity,
          price: detail.price,
          vatRate: detail.vatRate,
          total: total,
        };
      });

      setFormData({
        typeValue: invoice.typeValue === 2 ? "satis" : "alis",
        date: invoice.date,
        customerId: customer?.name || "",
        details: details || [],
        vatRate: invoice.vatRate || 0,
      });
    }
  }, [isEditMode, invoice, customers?.data, productsData]);

  // Form state değişikliklerini izle
  useEffect(() => {
    console.log('Form state güncellendi:', formData);
    console.log('Mevcut ürünler:', productsData.map(p => ({ 
      id: p.id, 
      name: p.name, 
      normalizedName: p.normalizedName 
    })));
  }, [formData, productsData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;

    // Eğer adet veya birim fiyat değişirse, toplamı otomatik hesapla
    const updatedItem = { ...newItem, [name]: value };

    if (name === "quantity" || name === "price") {
      const quantity =
        name === "quantity"
          ? Number.parseFloat(value) || 0
          : Number.parseFloat(newItem.quantity) || 0;
      const price =
        name === "price"
          ? Number.parseFloat(value) || 0
          : Number.parseFloat(newItem.price) || 0;
      updatedItem.total = formatNumber(quantity * price);
    }

    // KDV input'u temizlendiğinde 0 olarak ayarla
    if (name === "vatRate") {
      updatedItem.vatRate = value === "" ? 0 : Number(value).toFixed(2);
    }

    setNewItem(updatedItem);
  };

  const addItem = () => {
    if (newItem.productId && newItem.quantity && newItem.price) {
      // Adet kontrolü ekle
      const quantity = Number(newItem.quantity);
      if (quantity <= 0) {
        toast.error('Adet 0 veya negatif olamaz');
        return;
      }

      setFormData({
        ...formData,
        details: [...formData.details, { ...newItem }],
      });
      setNewItem({
        productId: "",
        quantity: "",
        price: "",
        total: "",
        vatRate: 0,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submit başladı', formData);
    
    if (isSubmitting) {
      console.log('Form zaten gönderiliyor...');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Submit işlemi başlatıldı');

      // Adet kontrolü
      const hasInvalidQuantity = formData.details.some(item => {
        const quantity = Number(item.quantity);
        return quantity <= 0;
      });

      if (hasInvalidQuantity) {
        toast.error('Adet 0 veya negatif olamaz');
        return;
      }

      // Müşteri kontrolü
      const customer = customers?.data?.find(
        (c) => c.name === formData.customerId
      );
      console.log('Bulunan müşteri:', customer);

      if (!customer) {
        toast.error('Lütfen geçerli bir müşteri seçin');
        return;
      }

      // Eksik ürünleri oluştur
      if (!formData.details || !Array.isArray(formData.details)) {
        console.error('Geçersiz fatura detayları:', formData.details);
        toast.error('Fatura detayları geçersiz');
        return;
      }

      const productNames = formData.details
        .map(item => item?.productId)
        .filter(name => name && typeof name === 'string');

      console.log('Oluşturulacak ürünler:', productNames);
      await createMissingProducts(productNames);

      // Ürün detaylarını hazırla
      const details = formData.details.map((item) => {
        if (!item || !item.productId) {
          console.error('Geçersiz ürün detayı:', item);
          return null;
        }

        console.log('İşlenen ürün:', item);
        
        // Ürün adını normalize et
        const normalizedProductName = item.productId.toLowerCase().trim();
        console.log('Normalize edilmiş ürün adı:', normalizedProductName);
        
        // Ürünü bul
        const product = productsData.find(
          (p) => p.normalizedName === normalizedProductName
        );
        
        console.log('Ürün arama detayları:', {
          aranan: normalizedProductName,
          mevcutUrunler: productsData.map(p => p.normalizedName),
          bulunanUrun: product
        });
        
        if (!product) {
          console.log('Ürün bulunamadı. Mevcut ürünler:', productsData.map(p => ({
            id: p.id,
            name: p.name,
            normalizedName: p.normalizedName
          })));
          toast.error(`Ürün bulunamadı: ${item.productId}`);
          return null;
        }

        return {
          productId: product.id,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          vatRate: Number(item.vatRate || 0),
          total: Number(item.total) || 0,
        };
      }).filter(Boolean);

      console.log('Hazırlanan detaylar:', details);

      if (details.length === 0) {
        toast.error('Lütfen en az bir ürün ekleyin');
        return;
      }

      const invoiceData = {
        typeValue: formData.typeValue === "satis" ? 2 : 1,
        customerId: customer.id,
        date: formData.date,
        details: details
      };

      console.log('Gönderilecek fatura verisi:', invoiceData);

      if (isEditMode) {
        await onEditInvoice(invoiceData);
      } else {
        await onAddInvoice(invoiceData);
      }
      
      console.log('Fatura başarıyla kaydedildi');
      onClose();
    } catch (error) {
      console.error('Fatura işlemi sırasında hata:', error);
      toast.error('Fatura işlenirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // İzin verilen dosya tipleri
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Lütfen sadece JPG, JPEG veya PNG dosyası yükleyin');
      return;
    }

    // Dosya boyutu kontrolü (örn: 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu 10MB\'dan büyük olamaz');
      return;
    }

    setUploadedFile(file);

    try {
      const result = await extractText(file).unwrap();
      console.log('API yanıtı:', result);
      
      if (result && result.data) {
        const extractedData = result.data;
        console.log('İşlenecek veri:', extractedData);
        
        // Müşteri adını bul
        const customer = customers?.data?.find(
          (c) => c.name.toLowerCase() === extractedData.customerName?.toLowerCase()
        );
        console.log('Bulunan müşteri:', customer);

        // Tarih formatını dönüştür
        let formattedDate = extractedData.date;
        if (extractedData.date) {
          try {
            // Türkçe ay isimlerini sayılara çevir
            const turkishMonths = {
              'Ocak': '01', 'Şubat': '02', 'Mart': '03', 'Nisan': '04',
              'Mayıs': '05', 'Haziran': '06', 'Temmuz': '07', 'Ağustos': '08',
              'Eylül': '09', 'Ekim': '10', 'Kasım': '11', 'Aralık': '12'
            };

            // Tarih formatını parse et (örn: "3 Temmuz 2030")
            const dateParts = extractedData.date.split(' ');
            if (dateParts.length === 3) {
              const day = dateParts[0].padStart(2, '0');
              const month = turkishMonths[dateParts[1]];
              const year = dateParts[2];
              if (day && month && year) {
                formattedDate = `${year}-${month}-${day}`;
              }
            }
          } catch (e) {
            console.error('Tarih dönüştürme hatası:', e);
            formattedDate = new Date().toISOString().split('T')[0];
          }
        }

        // Ürün detaylarını hazırla ve otomatik ekle
        const details = extractedData.details?.map(item => {
          // Ürün adını normalize et
          const normalizedProductName = item.productName?.toLowerCase().trim();
          console.log('Normalize edilmiş ürün adı:', normalizedProductName);
          
          // Ürünü bul
          const product = productsData.find(
            (p) => p.normalizedName === normalizedProductName
          );
          
          console.log('Ürün arama detayları:', {
            aranan: normalizedProductName,
            mevcutUrunler: productsData.map(p => p.normalizedName),
            bulunanUrun: product
          });
          
          // Toplam tutarı hesapla
          const quantity = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;
          const calculatedTotal = formatNumber(quantity * price);

          return {
            productId: product?.name || item.productName || "",
            quantity: item.quantity || "",
            price: item.price || "",
            total: calculatedTotal,
            vatRate: item.vatRate || 0
          };
        }) || [];

        console.log('Hazırlanan detaylar:', details);

        // Form verilerini güncelle
        const newFormData = {
          typeValue: extractedData.typeValue === 0 ? "satis" : "alis",
          customerId: customer?.name || extractedData.customerName || "",
          date: formattedDate || new Date().toISOString().split("T")[0],
          details: details,
          vatRate: 0
        };

        console.log('Yeni form verisi:', newFormData);
        setFormData(newFormData);

        // Başarılı mesajı göster
        toast.success(`${details.length} adet ürün başarıyla eklendi`);
      } else {
        toast.error('Fatura verisi alınamadı');
      }
    } catch (error) {
      console.error('Error processing invoice:', error);
      const errorMessage = error.data?.message || error.message || 'Fatura işlenirken bir hata oluştu';
      toast.error(errorMessage);
      setUploadedFile(null);
      setFormData({
        typeValue: "satis",
        date: new Date().toISOString().split("T")[0],
        customerId: "",
        details: [],
        vatRate: 0
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isEditMode ? "Fatura Düzenle" : "Yeni Fatura"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* File Upload Section */}
        <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <label 
              className={`cursor-pointer px-4 py-2 rounded-md transition-colors ${
                isExtracting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isExtracting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Yükleniyor...
                </span>
              ) : (
                'Fatura Görseli Yükle'
              )}
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isExtracting}
              />
            </label>
            {uploadedFile && (
              <div className="mt-2 flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {uploadedFile.name}
              </div>
            )}
            <p className="mt-2 text-sm text-gray-500">
              JPG, JPEG veya PNG formatında fatura görseli yükleyerek otomatik fatura oluşturabilirsiniz
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-1">Fatura Tipi</label>
              <div className="relative">
                <select
                  name="typeValue"
                  value={formData.typeValue}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 bg-white appearance-none pr-10"
                  required
                >
                  <option value="">Seçiniz...</option>
                  <option value="satis">Satış Faturası</option>
                  <option value="alis">Alış Faturası</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={16}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Tarih</label>
              <div className="relative">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 bg-white pr-10"
                  required
                />
                <Calendar
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={16}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Müşteri</label>
              <div className="relative">
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 bg-white appearance-none pr-10"
                  required
                >
                  <option value="">Seçiniz...</option>
                  {customers?.data?.map((customer) => (
                    <option key={customer.id} value={customer.name}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={16}
                />
              </div>
            </div>
          </div>

          {/* Ürün Ekleme Alanı */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            <div>
              <label className="block text-gray-700 mb-1">Ürün</label>
              <div className="relative">
                <select
                  name="productId"
                  value={newItem.productId}
                  onChange={handleItemChange}
                  className="w-full border border-gray-300 rounded-md p-2 bg-white appearance-none pr-10"
                >
                  <option value="">Seçiniz...</option>
                  {productsData?.map((product) => (
                    <option key={product.id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={16}
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Adet</label>
              <input
                type="number"
                name="quantity"
                value={newItem.quantity}
                onChange={handleItemChange}
                min="0.01"
                step="0.01"
                className="w-full border border-gray-300 rounded-md p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Birim Fiyat</label>
              <input
                type="number"
                name="price"
                value={newItem.price}
                onChange={handleItemChange}
                className="w-full border border-gray-300 rounded-md p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">KDV Oranı</label>
              <input
                type="number"
                name="vatRate"
                value={newItem.vatRate}
                onChange={handleItemChange}
                className="w-full border border-gray-300 rounded-md p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Toplam</label>
              <input
                type="text"
                name="total"
                value={newItem.total}
                readOnly
                className="w-full border border-gray-300 rounded-md p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">İşlemler</label>
              <button
                type="button"
                onClick={addItem}
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-md p-2 flex items-center justify-center"
              >
                <span>EKLE</span>
                <Plus size={16} className="ml-1" />
              </button>
            </div>
          </div>

          {/* Ürün Tablosu */}
          <div className="border-t border-b border-gray-400 py-2 mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-400">
                  <th className="py-2 text-left">#</th>
                  <th className="py-2 text-left">Ürün Adı</th>
                  <th className="py-2 text-left">Adet</th>
                  <th className="py-2 text-left">Birim Fiyat</th>
                  <th className="py-2 text-left">KDV Oranı</th>
                  <th className="py-2 text-left">Toplam</th>
                  <th className="py-2 text-left">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {formData.details && formData.details.length > 0 ? (
                  formData.details.map((item, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="py-2">{index + 1}</td>
                      <td className="py-2">{item.productId}</td>
                      <td className="py-2">{formatNumber(Number(item.quantity))}</td>
                      <td className="py-2">{formatNumber(Number(item.price))} ₺</td>
                      <td className="py-2">%{Number(item.vatRate).toFixed(2)}</td>
                      <td className="py-2">{item.total} ₺</td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              details: formData.details.filter((_, i) => i !== index)
                            });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-4 text-center text-gray-500">
                      {uploadedFile ? 'Fatura görselinden ürün okunamadı' : 'Henüz ürün eklenmedi'}
                    </td>
                  </tr>
                )}
              </tbody>
              {formData.details && formData.details.length > 0 && (
                <tfoot>
                  <tr className="border-t border-gray-400 font-semibold">
                    <td colSpan="5" className="py-2 text-right">Toplam Tutar:</td>
                    <td className="py-2">
                      {formatNumber(formData.details.reduce((sum, item) => sum + Number(item.total.replace(/\./g, '').replace(',', '.')), 0))} ₺
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting || formData.details.length === 0}
              className={`px-8 py-2 rounded-md font-medium ${
                formData.details.length > 0 && !isSubmitting
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting 
                ? "İşleniyor..." 
                : isEditMode 
                  ? "Faturayı Güncelle" 
                  : "Faturayı Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InvoiceModal;

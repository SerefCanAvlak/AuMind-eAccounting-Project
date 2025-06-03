import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5193/api",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Invoices", "PurchaseReports", "Customers", "Products", "Users", "Companies", "Banks", "BankDetails", "CashRegisterDetails"],  
  endpoints: (builder) => ({
    // Reports endpoints
    getPurchaseReports: builder.query({
      query: () => ({
        url: "/Reports/PurchaseReports",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }),
      providesTags: ["PurchaseReports"],
    }),
    // BankDetails endpoints
    getAllBankDetails: builder.mutation({
      query: (bankDetails) => ({
        url: "/BankDetails/GetAll",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...bankDetails }),
      }),
    }),

    createBankDetail: builder.mutation({
      query: (bankDetailData) => ({
        url: "/BankDetails/Create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bankDetailData),
      }),
    }),

    updateBankDetail: builder.mutation({
      query: (bankDetailData) => ({
        url: "/BankDetails/Update",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bankDetailData),
      }),
    }),

    deleteBankDetail: builder.mutation({
      query: (bankDetailId) => ({
        url: "/BankDetails/DeleteById",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: bankDetailId }),
      }),
    }),
    // Banks endpoints
    getAllBanks: builder.mutation({
      query: () => ({
        url: "/Banks/GetAll",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }),
    }),

    createBank: builder.mutation({
      query: (bankData) => ({
        url: "/Banks/Create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bankData),
      }),
    }),

    updateBank: builder.mutation({
      query: (bankData) => ({
        url: "/Banks/Update",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bankData),
      }),
    }),

    deleteBank: builder.mutation({
      query: (bankId) => ({
        url: "/Banks/DeleteById",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: bankId }),
      }),
    }),
    // Auth endpoints
    confirmEmail: builder.mutation({
      query: (data) => ({
        url: "/Auth/ConfirmEmail",
        method: "POST",
        body: data,
      }),
    }),

    login: builder.mutation({
      query: (credentials) => ({
        url: "/Auth/Login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),

    register: builder.mutation({
      query: (credentials) => ({
        url: "/Auth/Register",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),

    changeCompany: builder.mutation({
      query: (companyId) => ({
        url: "/Auth/changeCompany",
        method: "POST",
        body: { companyId },
      }),
    }),

    // Invoice endpoints
    getAllInvoices: builder.query({
      query: () => ({
        url: "/Invoices/GetAll",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }),
      providesTags: ["Invoices"],
    }),

    createInvoice: builder.mutation({
      query: (invoiceData) => ({
        url: "/Invoices/Create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      }),
      invalidatesTags: ["Invoices"],
    }),

    updateInvoice: builder.mutation({
      query: (invoiceData) => ({
        url: "/Invoices/Update",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      }),
      invalidatesTags: ["Invoices"],
    }),

    deleteInvoice: builder.mutation({
      query: (invoiceIds) => ({
        url: "/Invoices/DeleteById",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: invoiceIds }),
      }),
      invalidatesTags: ["Invoices"],
    }),

    generateInvoicePdf: builder.mutation({
      query: (invoiceId) => ({
        url: `/Invoices/GenerateInvoicePdf?invoiceId=${invoiceId}`,
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'PDF generation failed');
          }
          return response.blob();
        },
      }),
      invalidatesTags: ["Invoices"],
    }),

    // Extract text from invoice
    extractText: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append('FormFile', file);

        return {
          url: '/Invoices/ExtractText',
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': undefined,
          },
        };
      },
      transformErrorResponse: (response) => {
        // Response zaten bir obje olduğu için json() çağrısına gerek yok
        console.error('Server Error Response:', response);
        
        if (response.status === 500) {
          return {
            status: response.status,
            data: response.data || null,
            message: response.data?.message || 'Sunucu hatası: Fatura işlenirken bir hata oluştu'
          };
        }
        return response;
      }
    }),

    // Companies endpoints
    getAllCompanies: builder.mutation({
      query: () => ({
        url: "/Companies/GetAll",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }),
      invalidatesTags: ["Companies"],
    }),

    createCompany: builder.mutation({
      query: (company) => ({
        url: "/Companies/Create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: company,
      }),
      invalidatesTags: ["Companies"],
    }),

    updateCompany: builder.mutation({
      query: (company) => ({
        url: "/Companies/Update",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: company,
      }),
      invalidatesTags: ["Companies"],
    }),

    deleteCompany: builder.mutation({
      query: (companyId) => ({
        url: "/Companies/DeleteById",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: { id: companyId },
      }),
      invalidatesTags: ["Companies"],
    }),

    migrateAllCompanies: builder.mutation({
      query: () => ({
        url: "/Companies/MigrateAll",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }),
      invalidatesTags: ["Companies"],
    }),

    // Users endpoints
    getAllUsers: builder.mutation({
      query: () => ({
        url: "/Users/GetAll",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }),
      providesTags: ["Users"],
    }),

    createUser: builder.mutation({
      query: (userData) => ({
        url: "/Users/Create",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Users"],
    }),

    updateUser: builder.mutation({
      query: (userData) => ({
        url: "/Users/Update",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Users"],
    }),

    deleteUser: builder.mutation({
      query: (userId) => ({
        url: "/Users/DeleteById",
        method: "POST",
        body: { id: userId },
      }),
      invalidatesTags: ["Users"],
    }),

    // Reports endpoints
    getProductProfitabilityReports: builder.query({
      query: () => ({
        url: "/Reports/ProductProfitabilityReports",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }),
      providesTags: ["Reports"],
    }),
    // ProductDetails endpoints
    getAllProductDetails: builder.mutation({
      query: (productId) => ({
        url: "/ProductDetails/GetAll",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      }),
    }),
    // Products endpoints
    getAllProducts: builder.mutation({
      query: () => ({
        url: "/Products/GetAll",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }),
      providesTags: ["Products"],
    }),

    createProduct: builder.mutation({
      query: (productData) => ({
        url: "/Products/Create",
        method: "POST",
        body: productData,
      }),
      invalidatesTags: ["Products"],
    }),

    updateProduct: builder.mutation({
      query: (productData) => ({
        url: "/Products/Update",
        method: "POST",
        body: { id: productData.id, ...productData },
      }),
      invalidatesTags: ["Products"],
    }),

    deleteProduct: builder.mutation({
      query: (productId) => ({
        url: "/Products/DeleteById",
        method: "POST",
        body: { id: productId },
      }),
      invalidatesTags: ["Products"],
    }),

    // CustomerDetails endpoints
    getAllCustomerDetails: builder.mutation({
      query: (customerId) => ({
        url: "/CustomerDetails/GetAll",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerId }),
      }),
    }),

    // Customers endpoints
    getAllCustomers: builder.query({
      query: () => ({
        url: "/Customers/GetAll",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }),
      providesTags: ["Customers"],
    }),
    createCustomer: builder.mutation({
      query: (customerData) => ({
        url: "/Customers/Create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: customerData,
      }),
      invalidatesTags: ["Customers"],
    }),
    updateCustomer: builder.mutation({
      query: (customerData) => ({
        url: "/Customers/Update",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: customerData,
      }),
      invalidatesTags: ["Customers"],
    }),
    deleteCustomer: builder.mutation({
      query: (customerId) => ({
        url: "/Customers/DeleteById",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: { id: customerId },
      }),
      invalidatesTags: ["Customers"],
    }),

    // CashRegisters endpoints
    getAllCashRegisters: builder.mutation({
      query: () => ({
        url: "/CashRegisters/GetAll",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }),
    }),
    createCashRegister: builder.mutation({
      query: (cashRegisterData) => ({
        url: "/CashRegisters/Create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: cashRegisterData,
      }),
    }),
    updateCashRegister: builder.mutation({
      query: (cashRegisterData) => ({
        url: "/CashRegisters/Update",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: cashRegisterData,
      }),
    }),
    deleteCashRegister: builder.mutation({
      query: (cashRegisterId) => ({
        url: "/CashRegisters/DeleteById",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: { id: cashRegisterId },
      }),
    }),

     // Get all cash register details
     getAllCashRegisterDetails: builder.mutation({
      query: (cashRegisterDetailsData) => ({
        url: "/CashRegistersDetails/GetAll",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({...cashRegisterDetailsData}),
      }),
      providesTags: ["CashRegisterDetails"],
    }),

    // Create cash register detail
    createCashRegisterDetail: builder.mutation({
      query: (cashRegisterDetailData) => ({
        url: "/CashRegistersDetails/Create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cashRegisterDetailData),
      }),
      invalidatesTags: ["CashRegisterDetails"],
    }),

    // Update cash register detail
    updateCashRegisterDetail: builder.mutation({
      query: (cashRegisterDetailData) => ({
        url: "/CashRegistersDetails/Update",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cashRegisterDetailData),
      }),
      invalidatesTags: ["CashRegisterDetails"],
    }),

    // Delete cash register detail by ID
    deleteCashRegisterDetailById: builder.mutation({
      query: (id) => ({
        url: "/CashRegistersDetails/DeleteById",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      }),
      invalidatesTags: ["CashRegisterDetails"],
    }),
  }),
});
// Export hooks for usage in components
export const {
  useLoginMutation,
  useRegisterMutation,
  useChangeCompanyMutation,
  useGetAllUsersMutation,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useConfirmEmailMutation,
  useGetAllCompaniesMutation,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
  useMigrateAllCompaniesMutation,
  useGetAllInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useGetAllCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetAllCashRegistersMutation,
  useCreateCashRegisterMutation,
  useUpdateCashRegisterMutation,
  useDeleteCashRegisterMutation,
  useGetAllProductsMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetProductProfitabilityReportsQuery,
  useGetPurchaseReportsQuery,
  useGetAllProductDetailsMutation,
  useGetAllBankDetailsMutation,
  useCreateBankDetailMutation,
  useUpdateBankDetailMutation,
  useDeleteBankDetailMutation,
  useGetAllBanksMutation,
  useCreateBankMutation,
  useUpdateBankMutation,
  useDeleteBankMutation,
  useGetAllCustomerDetailsMutation,
  useGetAllCashRegisterDetailsMutation,
  useCreateCashRegisterDetailMutation,
  useUpdateCashRegisterDetailMutation,
  useDeleteCashRegisterDetailByIdMutation,
  useGenerateInvoicePdfMutation,
  useExtractTextMutation,
} = api;

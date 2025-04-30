import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5193/api",
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Auth endpoints
    confirmEmail: builder.mutation({
      query: (data) => ({
        url: "/Auth/ConfirmEmail",
        method: "POST",
        body: data,
      }),
    }),
    sendConfirmEmail: builder.mutation({
      query: (email) => ({
        url: "/Auth/SendConfirmEmail",
        method: "POST",
        body: { email },
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

    // Company endpoints
    changeCompany: builder.mutation({
      query: (companyId) => ({
        url: "/auth/changeCompany",
        method: "POST",
        body: { companyId },
      }),
    }),

    // Customer endpoints
    getCustomers: builder.query({
      query: () => ({
        url: "/Customers/GetAll",
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Eğer API boş bir gövde bekliyorsa
      })
    }),
    addCustomer: builder.mutation({
      query: (customer) => ({
        url: "/Customers/Create",
        method: "POST",
        body: customer,
      }),
    }),

    // Product endpoints
    getProducts: builder.query({
      query: () => "/Products/GetAll",
    }),
    addProduct: builder.mutation({
      query: (product) => ({
        url: "/Products/Create",
        method: "POST",
        body: product,
      }),
    }),

    // Cash Register endpoints
    getCashRegisters: builder.query({
      query: () => "/CashRegisters/GetAll",
    }),
    addCashRegister: builder.mutation({
      query: (cashRegister) => ({
        url: "/CashRegisters/Create",
        method: "POST",
        body: cashRegister,
      }),
    }),

    // Users endpoints
    getAllUsers: builder.query({
      query: () => ({
        url: "/Users/GetAll",
        method: "POST",
      }),
    }),
    createUser: builder.mutation({
      query: (userData) => ({
        url: "/Users/Create",
        method: "POST",
        body: userData,
      }),
    }),
    updateUser: builder.mutation({
      query: (userData) => ({
        url: "/Users/Update",
        method: "POST",
        body: userData,
      }),
    }),
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: "/Users/DeleteById",
        method: "POST",
        body: { id: userId },
      }),
    }),
  }),
});

// Export hooks for usage in components
export const {
  useLoginMutation,
  useChangeCompanyMutation,
  useGetCustomersQuery,
  useAddCustomerMutation,
  useGetProductsQuery,
  useAddProductMutation,
  useGetCashRegistersQuery,
  useAddCashRegisterMutation,
  useGetAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useConfirmEmailMutation,
} = api;

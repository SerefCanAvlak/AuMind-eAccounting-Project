import { authApi } from './authApi';
import { companyApi } from './companiesApi';
import { invoiceApi } from './invoicesApi';
import { userApi } from './usersApi';
import { customersApi } from './customersApi';
import { cashRegisterApi } from './cashRegisterApi';
import { productsApi } from './productsApi';
import { stockProfitabilityApi } from './stockProfitabilityApi';
import { banksApi } from './banksApi';
import { bankDetailsApi } from './bankDetails';

export const apiReducers = {
  [authApi.reducerPath]: authApi.reducer,
  [companyApi.reducerPath]: companyApi.reducer,
  [invoiceApi.reducerPath]: invoiceApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [customersApi.reducerPath]: customersApi.reducer,
  [cashRegisterApi.reducerPath]: cashRegisterApi.reducer,
  [productsApi.reducerPath]: productsApi.reducer,
  [stockProfitabilityApi.reducerPath]: stockProfitabilityApi.reducer,
  [banksApi.reducerPath]: banksApi.reducer,
  [bankDetailsApi.reducerPath]: bankDetailsApi.reducer,
};

export const apiMiddlewares = [
  authApi.middleware,
  companyApi.middleware,
  invoiceApi.middleware,
  userApi.middleware,
  customersApi.middleware,
  cashRegisterApi.middleware,
  productsApi.middleware,
  stockProfitabilityApi.middleware,
  banksApi.middleware,
  bankDetailsApi.middleware,
];

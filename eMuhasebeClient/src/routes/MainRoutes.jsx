import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import SalesReportPage from "../pages/SalesReport";
import Banks from "../pages/Banks";
import BankTransactions from "../pages/BankTransactions";
import Cariler from "../pages/Cariler";
import CariHareketleri from "../pages/CariHareketleri";
import Products from "../pages/Products";
import ProductDetailPage from "../pages/ProductDetail";
import InvoicesPage from "../pages/Invoices";
import BotSettingsPage from "../pages/settings/bot-settings";
import ChatPage from "../pages/Chat";
import CashPage from "../pages/Cash";
import CashTransactionPage from "../pages/CashTransaction";
import StockProfitability from "../pages/StockProfitability";
import Reports from "../pages/Reports";
import NotFound from "../pages/NotFound";

const MainRoutes = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "reports",
        element: <SalesReportPage />,
      },
      {
        path: "banks",
        element: <Banks />,
      },
      {
        path: "bank-transactions/:bankName",
        element: <BankTransactions />,
      },
      {
        path: "cariler",
        element: <Cariler />,
      },
      {
        path: "cari-hareketleri/:id",
        element: <CariHareketleri />,
      },
      {
        path: "products",
        element: <Products />,
      },
      {
        path: "product-detail/:id",
        element: <ProductDetailPage />,
      },
      {
        path: "invoices",
        element: <InvoicesPage />,
      },
      {
        path: "settings/bot",
        element: <BotSettingsPage />,
      },
      {
        path: "chat",
        element: <ChatPage />,
      },
      {
        path: "safes",
        element: <CashPage />,
      },
      {
        path: "cash-transaction/:id",
        element: <CashTransactionPage />,
      },
      {
        path: "stok-karlilik",
        element: <StockProfitability />,
      },
      {
        path: "raporlar",
        element: <Reports />,
      },
      {
        path: "not-found",
        element: <NotFound />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
];

export default MainRoutes;

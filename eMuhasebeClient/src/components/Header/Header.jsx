import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../UI/Button";
import { useAuth } from "../../hooks/useAuth";
import { LogIn, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import {
  useGetAllUsersMutation,
  useChangeCompanyMutation,
} from "../../store/api";
import { useToast } from "../../hooks/useToast";
import LoadingOverlay from "../UI/Spinner/LoadingOverlay";
import ConfirmationModal from "../UI/Modals/ConfirmationModal";

const Header = () => {
  // Get the current location
  const location = useLocation();

  // Get the navigate function from the useNavigate hook
  const navigate = useNavigate();

  // Get the isAuthenticated state and logout function from the useAuth hook
  const { isAuthenticated, logout, user } = useAuth();

  const { showToast } = useToast();

  // State for logout confirmation modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // State for companies dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [getAllUsers] = useGetAllUsersMutation();
  const [changeCompany] = useChangeCompanyMutation();

  useEffect(() => {
    const fetchUsers = async () => {
      const result = await getAllUsers().unwrap();
    };
    fetchUsers();
  }, [getAllUsers]);

  // Fetch companies when component mounts
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const userResult = await getAllUsers().unwrap();

        if (userResult?.isSuccessful) {
          const userCompanies = Array.isArray(userResult.data)
            ? userResult.data
            : [];

          // Find current user using user info from useAuth
          const currentUser = userCompanies.find(
            (u) => u.userName === user?.userName
          );

          if (
            currentUser &&
            currentUser.companyUsers &&
            Array.isArray(currentUser.companyUsers)
          ) {
            const userCompanies = currentUser.companyUsers.map(
              (cu) => cu.company
            );
            setCompanies(userCompanies);
          } else {
            setCompanies([]);
          }
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    if (isAuthenticated && user?.userName) {
      fetchCompanies();
    }
  }, [isAuthenticated, user, getAllUsers]);

  // Handle the authentication action
  const handleAuthAction = () => {
    if (isAuthenticated) {
      setIsLogoutModalOpen(true);
    } else {
      navigate("/auth/login");
    }
  };

  const handleLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    showToast("Başarıyla çıkış yapıldı", "success");
  };

  // Handle company change
  const handleCompanyChange = async (companyId) => {
    try {
      const result = await changeCompany(companyId);

      if (result?.data?.isSuccessful) {
        setIsDropdownOpen(false);
        showToast("Şirket değiştirildi", "success");
        setIsLoading(true);

        // Şirket listesini yeniden yükle
        const userResult = await getAllUsers().unwrap();

        if (userResult?.isSuccessful) {
          const userCompanies = Array.isArray(userResult.data)
            ? userResult.data
            : [];

          const currentUser = userCompanies.find(
            (u) => u.userName === user?.userName
          );

          if (
            currentUser &&
            currentUser.companyUsers &&
            Array.isArray(currentUser.companyUsers)
          ) {
            const userCompanies = currentUser.companyUsers.map(
              (cu) => cu.company
            );
            setCompanies(userCompanies);
          }
        }

        // Sayfayı yenile
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error("Error changing company:", error);
      showToast("Şirket değiştirilirken bir hata oluştu", "error");
    }
  };

  // Check if the current page is an authentication page
  const isAuthPage = location.pathname.startsWith("/auth") ? true : false;

  // Check if the current page is a bot page
  const isBotPage = location.pathname.startsWith("/chat") ? true : false;

  return (
    <>
      {isLoading && <LoadingOverlay />}
      {/* Header */}
      <header className="bg-gray-800 text-white p-2 px-4 flex justify-between items-center">
        <div className="flex items-center border-l-[3px] ml-[-10px] border-yellow-400">
          {isAuthenticated && (
            <div className="ml-4 bg-white text-black rounded px-3 py-2 flex items-center relative">
              <span className="mr-2">{"Şirket Seçiniz"}</span>
              {isAuthenticated && (
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="focus:outline-none"
                >
                  <ChevronDown size={20} className="text-gray-600" />
                </button>
              )}

              {/* Company Dropdown */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg z-50">
                  <div className="py-1">
                    {companies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => handleCompanyChange(company.id)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                      >
                        {company.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-x-3">
          {/* Home Button */}
          <Link to="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-yellow-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="sr-only">Ana Sayfa</span>
            </Button>
          </Link>

          {/* Auth Button */}
          <button
            className={`p-2 text-white rounded-md ${
              isAuthenticated
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
            onClick={handleAuthAction}
          >
            <LogIn size={24} />
          </button>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Çıkış Yap"
        message="Çıkış yapmak istediğinize emin misiniz?"
        confirmText="Evet, Çıkış Yap"
        cancelText="Vazgeç"
      />

      {/* Back Button */}
      {isAuthPage || isBotPage ? (
        ""
      ) : (
        <div className="p-4 flex justify-end bg-gray-100">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border bg-yellow-400 border-yellow-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            <span className="sr-only">Geri</span>
          </Button>
        </div>
      )}
    </>
  );
};

export default Header;

import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  selectAuth, 
  selectUser, 
  selectIsAuthenticated, 
  selectCurrentCompany,
  logout,
  setCurrentCompany 
} from '../store/slices/authSlice';
import { useLoginMutation, useChangeCompanyMutation } from '../store/api';

// Auth Custom hook
export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentCompany = useSelector(selectCurrentCompany);
  
  const [loginMutation] = useLoginMutation();
  const [changeCompanyMutation] = useChangeCompanyMutation();

  console.log(loginMutation)
  const handleLogin = async (credentials) => {
    try {
      await loginMutation(credentials).unwrap();
      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleChangeCompany = async (companyId) => {
    try {
      const result = await changeCompanyMutation(companyId).unwrap();
      dispatch(setCurrentCompany(result.company));
    } catch (error) {
      throw error;
    }
  };

  return {
    auth,
    user,
    isAuthenticated,
    currentCompany,
    login: handleLogin,
    logout: handleLogout,
    changeCompany: handleChangeCompany,
  };
};
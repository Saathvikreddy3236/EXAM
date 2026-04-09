import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "./lib/api";

const TOKEN_KEY = "expense_tracker_token";

const defaultState = {
  user: null,
  dashboard: null,
  budgets: [],
  recentTransactions: [],
  friends: [],
  friendRequests: [],
  categories: [],
  paymentModes: [],
  personalExpenses: [],
  sharedExpenses: { paidByYou: [], owedByYou: [] },
  owed: [],
  receivable: [],
};

const AppContext = createContext(null);

function buildAvatar(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function getLocalDateString() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function AppProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [state, setState] = useState(defaultState);
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  const [isLoading, setIsLoading] = useState(false);

  const applyAuth = (authPayload) => {
    localStorage.setItem(TOKEN_KEY, authPayload.token);
    setToken(authPayload.token);
    setState((current) => ({
      ...current,
      user: authPayload.user,
    }));
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setState(defaultState);
  };

  const refreshAppData = async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      return;
    }

    setIsLoading(true);

    try {
      const [
        profileRes,
        dashboardRes,
        recentRes,
        budgetsRes,
        friendsRes,
        requestsRes,
        categoriesRes,
        paymentModesRes,
        personalRes,
        sharedRes,
        owedRes,
        receivableRes,
      ] = await Promise.all([
        api.get("/user/profile"),
        api.get("/meta/dashboard"),
        api.get("/expense/recent"),
        api.get("/budget/all"),
        api.get("/friends/list"),
        api.get("/friends/requests"),
        api.get("/meta/categories"),
        api.get("/meta/payment-modes"),
        api.get("/expense/personal"),
        api.get("/expense/shared"),
        api.get("/shared-expense/owed"),
        api.get("/shared-expense/receivable"),
      ]);

      setState({
        user: profileRes.data,
        dashboard: dashboardRes.data,
        budgets: budgetsRes.data,
        recentTransactions: recentRes.data,
        friends: friendsRes.data,
        friendRequests: requestsRes.data,
        categories: categoriesRes.data,
        paymentModes: paymentModesRes.data,
        personalExpenses: personalRes.data,
        sharedExpenses: sharedRes.data,
        owed: owedRes.data,
        receivable: receivableRes.data,
      });
    } finally {
      setIsLoading(false);
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setIsBootstrapping(false);
      return;
    }

    refreshAppData().catch(() => {
      logout();
      setIsBootstrapping(false);
    });
  }, [token]);

  const register = async (payload) => {
    const response = await api.post("/auth/register", payload);
    applyAuth(response.data);
    await refreshAppData();
  };

  const login = async (payload) => {
    const response = await api.post("/auth/login", payload);
    applyAuth(response.data);
    await refreshAppData();
  };

  const updateProfile = async (payload) => {
    await api.put("/user/profile", payload);
    await refreshAppData();
  };

  const sendFriendRequest = async (username) => {
    await api.post("/friends/add", { username });
    await refreshAppData();
  };

  const acceptFriendRequest = async (requestId) => {
    await api.post("/friends/accept", { requestId });
    await refreshAppData();
  };

  const rejectFriendRequest = async (requestId) => {
    await api.post("/friends/reject", { requestId });
    await refreshAppData();
  };

  const addExpense = async (payload) => {
    await api.post("/expense/add", payload);
    await refreshAppData();
  };

  const updateExpense = async (id, payload) => {
    await api.put(`/expense/personal/${id}`, payload);
    await refreshAppData();
  };

  const deleteExpense = async (id) => {
    await api.delete(`/expense/personal/${id}`);
    await refreshAppData();
  };

  const saveBudget = async ({ catId, amount, isUpdate }) => {
    if (isUpdate) {
      await api.put("/budget/update", { catId, amount });
    } else {
      await api.post("/budget/add", { catId, amount });
    }
    await refreshAppData();
  };

  const addRepayment = async ({ sharedExpenseId, amount, note }) => {
    await api.post("/repayment/add", {
      sharedExpenseId,
      amount,
      date: getLocalDateString(),
      note,
    });
    await refreshAppData();
  };

  const value = useMemo(
    () => ({
      ...state,
      token,
      isLoggedIn: Boolean(token),
      isBootstrapping,
      isLoading,
      login,
      register,
      logout,
      refreshAppData,
      updateProfile,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      addExpense,
      updateExpense,
      deleteExpense,
      saveBudget,
      addRepayment,
      avatar: buildAvatar(state.user?.fullname || state.user?.username || ""),
      getLocalDateString,
    }),
    [state, token, isBootstrapping, isLoading]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}

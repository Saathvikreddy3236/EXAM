import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "./lib/api";
import { ToastViewport } from "./components/UI";
import { io } from "socket.io-client";

const TOKEN_KEY = "expense_tracker_token";

const defaultState = {
  user: null,
  dashboard: null,
  analytics: null,
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

const defaultExpenseFilters = {
  categoryIds: [],
  modeIds: [],
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
  search: "",
};

const defaultSort = {
  sortBy: "date",
  sortOrder: "desc",
};

function buildFilterParams(filters, sort) {
  const params = {};

  if (filters.categoryIds?.length) {
    params.categoryIds = filters.categoryIds.join(",");
  }
  if (filters.modeIds?.length) {
    params.modeIds = filters.modeIds.join(",");
  }
  if (filters.startDate) {
    params.startDate = filters.startDate;
  }
  if (filters.endDate) {
    params.endDate = filters.endDate;
  }
  if (filters.minAmount !== "") {
    params.minAmount = filters.minAmount;
  }
  if (filters.maxAmount !== "") {
    params.maxAmount = filters.maxAmount;
  }
  if (filters.search) {
    params.search = filters.search;
  }
  if (sort?.sortBy) {
    params.sortBy = sort.sortBy;
    params.sortOrder = sort.sortOrder;
  }

  return params;
}

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

function extractErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.message || fallbackMessage;
}

export function AppProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [state, setState] = useState(defaultState);
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);
  const [expenseFilters, setExpenseFilters] = useState(defaultExpenseFilters);
  const [personalSort, setPersonalSort] = useState(defaultSort);
  const [sharedSort, setSharedSort] = useState(defaultSort);

  const dismissToast = (toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  };

  const showToast = ({ type = "success", title, message = "" }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, type, title, message }]);
  };

  const runAction = async (work, options) => {
    try {
      const result = await work();
      if (options?.successTitle) {
        showToast({
          type: "success",
          title: options.successTitle,
          message: options.successMessage || "",
        });
      }
      return result;
    } catch (error) {
      showToast({
        type: "error",
        title: options?.errorTitle || "Something went wrong",
        message: extractErrorMessage(error, options?.errorMessage || "Please try again."),
      });
      throw error;
    }
  };

  const applyAuth = (authPayload) => {
    localStorage.setItem(TOKEN_KEY, authPayload.token);
    setToken(authPayload.token);
    setState((current) => ({
      ...current,
      user: authPayload.user,
    }));
  };

  const logout = ({ silent = false } = {}) => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setState(defaultState);
    if (!silent) {
      showToast({
        type: "success",
        title: "Logged out",
        message: "Your session has been closed.",
      });
    }
  };

  const refreshAppData = async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      return;
    }

    const filterParams = buildFilterParams(expenseFilters);
    const personalParams = buildFilterParams(expenseFilters, personalSort);
    const sharedParams = buildFilterParams(expenseFilters, sharedSort);

    setIsLoading(true);

    try {
      const [
        profileRes,
        dashboardRes,
        analyticsRes,
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
        api.get("/meta/dashboard", { params: filterParams }),
        api.get("/meta/analytics", { params: filterParams }),
        api.get("/expense/recent", { params: filterParams }),
        api.get("/budget/all", { params: filterParams }),
        api.get("/friends/list"),
        api.get("/friends/requests"),
        api.get("/meta/categories"),
        api.get("/meta/payment-modes"),
        api.get("/expense/personal", { params: personalParams }),
        api.get("/expense/shared", { params: sharedParams }),
        api.get("/shared-expense/owed"),
        api.get("/shared-expense/receivable"),
      ]);

      setState({
        user: profileRes.data,
        dashboard: dashboardRes.data,
        analytics: analyticsRes.data,
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
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsBootstrapping(false);
      return;
    }

    refreshAppData().catch(() => {
      logout({ silent: true });
      setIsBootstrapping(false);
    });
  }, [token, expenseFilters, personalSort, sharedSort]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const socket = io(api.defaults.baseURL, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("repayment:updated", (payload) => {
      refreshAppData().catch(() => {});
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [token]);

  const register = async (payload) => {
    await runAction(async () => {
      const response = await api.post("/auth/register", payload);
      applyAuth(response.data);
      await refreshAppData();
    }, {
      successTitle: "Account created",
      successMessage: "Your profile is ready and you are now signed in.",
      errorTitle: "Registration failed",
      errorMessage: "We could not create your account.",
    });
  };

  const login = async (payload) => {
    await runAction(async () => {
      const response = await api.post("/auth/login", payload);
      applyAuth(response.data);
      await refreshAppData();
    }, {
      successTitle: "Login successful",
      successMessage: "Welcome back to Shared Wallet.",
      errorTitle: "Login failed",
      errorMessage: "We could not sign you in.",
    });
  };

  const updateProfile = async (payload) => {
    await runAction(async () => {
      await api.put("/user/profile", payload);
      await refreshAppData();
    }, {
      successTitle: "Profile updated",
      successMessage: "Your details have been saved.",
      errorTitle: "Profile update failed",
      errorMessage: "We could not update your profile.",
    });
  };

  const sendFriendRequest = async (username) => {
    await runAction(async () => {
      await api.post("/friends/add", { username });
      await refreshAppData();
    }, {
      successTitle: "Friend request sent",
      successMessage: `Your request to @${username} is on the way.`,
      errorTitle: "Request failed",
      errorMessage: "We could not send the friend request.",
    });
  };

  const acceptFriendRequest = async (requestId) => {
    await runAction(async () => {
      await api.post("/friends/accept", { requestId });
      await refreshAppData();
    }, {
      successTitle: "Friend request accepted",
      successMessage: "Your friends list has been updated.",
      errorTitle: "Accept failed",
      errorMessage: "We could not accept that friend request.",
    });
  };

  const rejectFriendRequest = async (requestId) => {
    await runAction(async () => {
      await api.post("/friends/reject", { requestId });
      await refreshAppData();
    }, {
      successTitle: "Request rejected",
      successMessage: "The friend request was removed.",
      errorTitle: "Reject failed",
      errorMessage: "We could not reject that friend request.",
    });
  };

  const addExpense = async (payload) => {
    await runAction(async () => {
      await api.post("/expense/add", payload);
      await refreshAppData();
    }, {
      successTitle: "Expense added",
      successMessage: payload.isShared ? "Shared expense saved and balances updated." : "Your expense was saved successfully.",
      errorTitle: "Expense add failed",
      errorMessage: "We could not save that expense.",
    });
  };

  const updateExpense = async (id, payload) => {
    await runAction(async () => {
      await api.put(`/expense/personal/${id}`, payload);
      await refreshAppData();
    }, {
      successTitle: "Expense updated",
      successMessage: "Your expense changes were saved.",
      errorTitle: "Expense update failed",
      errorMessage: "We could not update that expense.",
    });
  };

  const deleteExpense = async (id) => {
    await runAction(async () => {
      await api.delete(`/expense/personal/${id}`);
      await refreshAppData();
    }, {
      successTitle: "Expense deleted",
      successMessage: "The expense was removed from your records.",
      errorTitle: "Expense delete failed",
      errorMessage: "We could not delete that expense.",
    });
  };

  const saveBudget = async ({ catId, amount, isUpdate }) => {
    await runAction(async () => {
      if (isUpdate) {
        await api.put("/budget/update", { catId, amount });
      } else {
        await api.post("/budget/add", { catId, amount });
      }
      await refreshAppData();
    }, {
      successTitle: isUpdate ? "Budget updated" : "Budget added",
      successMessage: "Category budget and warning progress have been refreshed.",
      errorTitle: "Budget save failed",
      errorMessage: "We could not save that budget.",
    });
  };

  const addRepayment = async ({ sharedExpenseId, amount, note }) => {
    await runAction(async () => {
      await api.post("/repayment/add", {
        sharedExpenseId,
        amount,
        date: getLocalDateString(),
        note,
      });
    }, {
      successTitle: "Repayment recorded",
      successMessage: "The shared expense balance has been updated.",
      errorTitle: "Repayment failed",
      errorMessage: "We could not record that repayment.",
    });
  };

  const exportCsv = async () => {
    await runAction(async () => {
      const response = await api.get("/export/csv", {
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "expense-export.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    }, {
      successTitle: "CSV export ready",
      successMessage: "Your expense and settlement data has been downloaded.",
      errorTitle: "CSV export failed",
      errorMessage: "We could not export your CSV file.",
    });
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
      exportCsv,
      expenseFilters,
      setExpenseFilters,
      resetExpenseFilters: () => setExpenseFilters(defaultExpenseFilters),
      personalSort,
      setPersonalSort,
      sharedSort,
      setSharedSort,
      avatar: buildAvatar(state.user?.fullname || state.user?.username || ""),
      getLocalDateString,
      showToast,
    }),
    [state, token, isBootstrapping, isLoading, expenseFilters, personalSort, sharedSort]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

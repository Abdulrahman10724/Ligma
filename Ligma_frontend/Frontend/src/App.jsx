import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { store } from "./redux/store";
import AppRoutes from "./routes/AppRoutes";
import { bootstrapAuth } from "./redux/authSlice";

function App() {
  return (
    <Provider store={store}>
      <AppBootstrap />
      <Toaster position="bottom-right" richColors theme="system" />
    </Provider>
  );
}

function AppBootstrap() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  return <AppRoutes />;
}

export default App;

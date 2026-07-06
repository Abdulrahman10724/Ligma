import "react";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { store } from "./redux/store";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <Provider store={store}>
      <AppRoutes />
      <Toaster position="bottom-right" richColors theme="system" />
    </Provider>
  );
}

export default App;

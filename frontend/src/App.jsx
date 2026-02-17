import Navbar from "./components/layout/Navbar";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <div className="app-wrapper">
      <Navbar />
      <main className="main-container">
        <AppRoutes />
      </main>
    </div>
  );
}

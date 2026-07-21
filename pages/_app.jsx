import "@/styles/globals.css";
import { AuthProvider } from "@/components/auth-context";
import ProtectedRoute from "@/components/protected-route";
import { Toaster } from "react-hot-toast";
import { useRouter } from "next/router";

const PUBLIC_PAGES = ["/", "/login", "/_error", "/404"];

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isPublic = PUBLIC_PAGES.includes(router.pathname);

  return (
    <AuthProvider>
      {isPublic ? (
        <Component {...pageProps} />
      ) : (
        <ProtectedRoute>
          <Component {...pageProps} />
        </ProtectedRoute>
      )}
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

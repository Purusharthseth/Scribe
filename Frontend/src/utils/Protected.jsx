import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return <div>Loading...</div>; // Wait for Clerk to load
  return isSignedIn ? children : <Navigate to="/sign-in" />;
}

export default ProtectedRoute;

import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  isAllowed: boolean;
  redirectTo?: string;
  children: ReactNode;
}

export default function ProtectedRoute({
  isAllowed,
  redirectTo = "/",
  children,
}: ProtectedRouteProps) {
  const location = useLocation();

  if (!isAllowed) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children as React.ReactElement;
}

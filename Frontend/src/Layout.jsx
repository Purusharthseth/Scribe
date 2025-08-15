import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./component/Header";
import { Theme } from "@radix-ui/themes";
import { Toaster } from 'react-hot-toast';

export default function Layout() {
  return (
    <Theme appearance="dark" grayColor="mauve" accentColor="blue">
      <Header />
      <main className="mt-10 h-screen overflow-hidden">
        <Outlet />
      </main>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--gray-2)',
            color: 'var(--gray-12)',
            border: '1px solid var(--gray-6)',
          },
          success: {
            style: {
              background: 'var(--green-2)',
              color: 'var(--green-12)',
              border: '1px solid var(--green-6)',
            },
          },
          error: {
            style: {
              background: 'var(--red-2)',
              color: 'var(--red-12)',
              border: '1px solid var(--red-6)',
            },
          },
        }}
      />
    </Theme>
  );
}
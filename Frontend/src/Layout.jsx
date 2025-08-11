import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./component/Header";
import { Theme } from "@radix-ui/themes";

export default function Layout() {
  return (
    <Theme grayColor="mauve">
      <Header />
      <main className="mt-10 h-screen overflow-hidden">
        <Outlet />
      </main>
    </Theme>
  );
}
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./component/Header";
import { Theme } from "@radix-ui/themes";

export default function Layout() {
  return (
    <Theme appearance="dark" grayColor="mauve" accentColor="blue">
      <Header />
      <main className="mt-10 h-screen overflow-hidden">
        <Outlet />
      </main>
    </Theme>
  );
}
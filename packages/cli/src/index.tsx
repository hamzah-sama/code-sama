import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { RootLayout } from "./components/layout/root-layout";
import { HomeScreen } from "./components/screen/home";
import { NewSession } from "./components/session/new-session";
import { Session } from "./components/session/session";

const router = createMemoryRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomeScreen />,
      },
      {
        path: "/session/new",
        element: <NewSession />,
      },
      {
        path: "/session/:id",
        element: <Session />,
      },
    ],
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

const renderer = await createCliRenderer({
  exitOnCtrlC: false,
  targetFps: 60,
});
createRoot(renderer).render(<AppRouter />);

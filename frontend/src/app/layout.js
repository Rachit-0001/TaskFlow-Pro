import "./globals.css";

export const metadata = {
  title: "TaskFlow Pro",
  description:
    "Dependency-Aware Workflow and DAG Scheduling Engine",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
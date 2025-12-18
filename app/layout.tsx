import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { PrivyAuthProvider } from "@/contexts/PrivyAuthContext";
import { IframeDataProvider } from "@/contexts/IframeDataContext";

import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://terminal.vitadao.com"),
  title: "Vita Terminal - VitaDAO Knowledge Assistant",
  description:
    "Vita Terminal helps users find information about VitaDAO, VitaLabs, the Fellowship Program, projects, funding, and team formation.",
  openGraph: {
    title: "Vita Terminal - VitaDAO Knowledge Assistant",
    description:
      "Vita Terminal helps users find information about VitaDAO, VitaLabs, the Fellowship Program, projects, funding, and team formation.",
    url: "https://terminal.vitadao.com",
    siteName: "Vita Terminal",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vita Terminal",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vita Terminal - VitaDAO Knowledge Assistant",
    description:
      "Vita Terminal helps users find information about VitaDAO, VitaLabs, the Fellowship Program, projects, funding, and team formation.",
    images: ["/og-image.png"],
  },
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "#000000";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geist.variable} ${geistMono.variable}`}
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required"
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          enableSystem
        >
          <PrivyAuthProvider>
            <IframeDataProvider>
              <Toaster position="top-center" />
              <SessionProvider>{children}</SessionProvider>
            </IframeDataProvider>
          </PrivyAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

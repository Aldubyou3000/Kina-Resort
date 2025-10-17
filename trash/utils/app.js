import { renderHeader } from "./components/header.js";
import { renderFooter } from "./components/footer.js";
import { showToast } from "./components/toast.js";
import { setBusy } from "./components/loader.js";
import { HomePage } from "./pages/home.js";
import { PackagesPage } from "./pages/packages.js";
import { RoomsPage } from "./pages/rooms.js";
import { AuthPage } from "./pages/auth.js";
import { BookingsPage } from "./pages/bookings.js";
import { AdminPage } from "./pages/admin.js";
import { WeatherPage } from "./pages/weather.js";
import { CheckoutPage } from "./pages/checkout.js";
import { getAuthState } from "./utils/state.js";

const routes = {
  "/": HomePage,
  "/packages": PackagesPage,
  "/rooms": RoomsPage,
  "/auth": AuthPage,
  "/bookings": BookingsPage,
  "/admin": AdminPage,
  "/weather": WeatherPage,
  "/checkout": CheckoutPage,
  "/about": () =>
    `<section class="container"><h2>About Kina Resort</h2><p>Experience tropical serenity with modern comfort.</p></section>`,
};

function updateAdminVisibility() {
  const { role } = getAuthState();
  const adminLinks = document.querySelectorAll(".admin-only");
  adminLinks.forEach((node) => {
    if (role === "admin" || role === "staff") {
      node.hidden = false;
    } else {
      node.hidden = true;
    }
  });
}

async function router() {
  const path = location.hash.replace("#", "") || "/";
  const Page =
    routes[path] ||
    (() => `<section class="container"><h2>Not Found</h2></section>`);
  const main = document.getElementById("main");
  setBusy(true);
  try {
    const html = await Page();
    main.innerHTML = html;
  } catch (err) {
    console.error(err);
    showToast("Something went wrong loading this page.", "error");
    main.innerHTML = `<section class="container"><h2>Error</h2><p>Please try again.</p></section>`;
  } finally {
    setBusy(false);
    updateAdminVisibility();
  }
}

function onReady() {
  renderHeader();
  renderFooter();
  document.querySelector(".nav-toggle")?.addEventListener("click", () => {
    const menu = document.getElementById("primary-menu");
    const expanded = menu.classList.toggle("open");
    document
      .querySelector(".nav-toggle")
      .setAttribute("aria-expanded", String(expanded));
  });
  window.addEventListener("hashchange", router);
  router();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onReady);
} else {
  onReady();
}

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "mk" | "en";

const dict = {
  mk: {
    home: "Почетна", menu: "Мени", cart: "Кошничка", admin: "Админ",
    heroTitle: "Кафе што се пие полека.", heroSub: "Специјално кафе, домашни колачи и мирен агол во срцето на Скопје. Нарачај онлајн и подигни без чекање.",
    seeMenu: "Погледни мени", orderNow: "Нарачај сега", featured: "Омилени на гостите",
    search: "Пребарај кафе, чај, десерт...", all: "Сите", addToCart: "Додај", unavailable: "Нема",
    noResults: "Нема резултати за пребарувањето.", emptyCart: "Кошничката е празна.",
    total: "Вкупно", checkout: "Потврди нарачка", name: "Име и презиме", phone: "Телефон",
    table: "Број на маса (опционално)", note: "Забелешка (опционално)", placing: "Се испраќа...",
    orderPlaced: "Нарачката е примена!", orderNo: "Нарачка", status: "Статус",
    pending: "Примена", preparing: "Се подготвува", ready: "Готова", completed: "Завршена", cancelled: "Откажана",
    backToMenu: "Назад кон менито", notFound: "Нарачката не е пронајдена.", remove: "Отстрани",
    hours: "Работно време", hoursText: "Пон–Пет 07–22 · Саб–Нед 08–23", address: "Адреса", addressText: "ул. Македонија 1, Скопје",
    orderError: "Нарачката не успеа. Проверете ги податоците.", autoRefresh: "Статусот се освежува автоматски.",
    signIn: "Најава", signUp: "Регистрација", email: "Е-пошта", password: "Лозинка", signOut: "Одјава",
    orders: "Нарачки", menuMgmt: "Уредување мени", notAdmin: "Вашата сметка нема админ права.",
    newItem: "Нов производ", save: "Зачувај", cancel: "Откажи", edit: "Уреди", delete: "Избриши",
    price: "Цена (ден.)", category: "Категорија", image: "URL на слика", available: "Достапно",
    description: "Опис", nameMk: "Име (МК)", nameEn: "Име (EN)", descMk: "Опис (МК)", descEn: "Опис (EN)",
    checkEmail: "Проверете ја е-поштата за потврда на сметката.", noOrders: "Сè уште нема нарачки.",
  },
  en: {
    home: "Home", menu: "Menu", cart: "Cart", admin: "Admin",
    heroTitle: "Coffee worth slowing down for.", heroSub: "Specialty coffee, homemade pastries and a quiet corner in the heart of Skopje. Order online and pick up without waiting.",
    seeMenu: "View menu", orderNow: "Order now", featured: "Guest favourites",
    search: "Search coffee, tea, dessert...", all: "All", addToCart: "Add", unavailable: "Sold out",
    noResults: "No items match your search.", emptyCart: "Your cart is empty.",
    total: "Total", checkout: "Place order", name: "Full name", phone: "Phone",
    table: "Table number (optional)", note: "Note (optional)", placing: "Placing...",
    orderPlaced: "Order received!", orderNo: "Order", status: "Status",
    pending: "Received", preparing: "Preparing", ready: "Ready", completed: "Completed", cancelled: "Cancelled",
    backToMenu: "Back to menu", notFound: "Order not found.", remove: "Remove",
    hours: "Opening hours", hoursText: "Mon–Fri 07–22 · Sat–Sun 08–23", address: "Address", addressText: "Makedonija St. 1, Skopje",
    orderError: "Order failed. Please check your details.", autoRefresh: "Status refreshes automatically.",
    signIn: "Sign in", signUp: "Sign up", email: "Email", password: "Password", signOut: "Sign out",
    orders: "Orders", menuMgmt: "Manage menu", notAdmin: "Your account has no admin rights.",
    newItem: "New item", save: "Save", cancel: "Cancel", edit: "Edit", delete: "Delete",
    price: "Price (MKD)", category: "Category", image: "Image URL", available: "Available",
    description: "Description", nameMk: "Name (MK)", nameEn: "Name (EN)", descMk: "Description (MK)", descEn: "Description (EN)",
    checkEmail: "Check your email to confirm the account.", noOrders: "No orders yet.",
  },
} as const;

export type DictKey = keyof (typeof dict)["mk"];

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string }>({
  lang: "mk", setLang: () => {}, t: (k) => dict.mk[k],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("mk");
  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "mk") setLangState(saved);
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem("lang", l); };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[lang][k] }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

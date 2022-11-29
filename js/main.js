"use strict";

import { NetworkError, delay, WebError } from "./utils.js";
import pickRandomName from "./catlist.js";

const APP = {
  html: {
    category: undefined,
    results: undefined,
    error: undefined,
    overlay: undefined,
  },
  url: {
    categories: new URL(`https://api.thecatapi.com/v1/categories`),
    search: new URL(`https://api.thecatapi.com/v1/images/search`),
  },
  key: {
    localStorage: `ulut0002-cat`,
    api: `live_TEJ0VjdTT4NGUFndxmOvv1KGNRjSP3VerfWsgKr427PkZq6eEFigHcCw0mkZ6r6a`,
  },
  data: {
    names: undefined,
  },
  errors: {
    WEB_ERROR: "An unexpected error happened: ",
    FETCH_ERROR: "Fetch failed.",
  },
  init: () => {
    APP.getHTMLElements();
    if (APP.html.category)
      APP.html.category.addEventListener("change", APP.handleCategoryChange);
    APP.readNamesFromStorage();
    APP.fetchCategories();
  },
  getHTMLElements: function () {
    APP.html.category = document.querySelector(".search--category--select");
    APP.html.results = document.querySelector(".cat-card-container");
    APP.html.error = document.querySelector(".error--container");
    APP.html.overlay = document.querySelector(".overlay");
  },
  handleCategoryChange: function (ev) {
    if (!APP.html.category) return;
    APP.search(APP.html.category.value);
  },
  fetchCategories: function () {
    //if categories are available in local storage, read it and return.

    const storageKey = `${APP.key.localStorage}-categories`;
    const categoriesObj = localStorage.getItem(storageKey);
    if (categoriesObj) {
      APP.showCategories(JSON.parse(categoriesObj));
      return;
    }

    //local storage is empty. Connect cat-api and get results
    fetch(APP.url.categories)
      .then((response) => {
        if (!response.ok)
          throw new NetworkError("Category fetch failed", response);
        return response.json();
      })
      .then((data) => {
        APP.showCategories(data);
        APP.saveToStorage(storageKey, data);
      })
      .catch((err) => {
        APP.handleError(new NetworkError("Network Error", err.response));
      });
  },

  showCategories: function (categories) {
    if (!APP.html.category) return;
    APP.setInnerHTML(
      APP.html.category,
      `<option>Select an option</option>` +
        categories
          .map(({ id, name }) => `<option value=${id}>${name}</option>`)
          .join("")
    );
  },

  showResults: function (data) {
    // data = undefined;
    if (!data) {
      APP.handleError(new Error("Sorry, no results"));
      return;
    }
    let newEntry = false;
    const storageKey = APP.key.localStorage + "-names";
    APP.setInnerHTML(
      APP.html.results,
      data
        .map(({ id, url }) => {
          let nameToDisplay = "";
          nameToDisplay = APP.data.names[id];
          if (!nameToDisplay) {
            newEntry = true;
            nameToDisplay = pickRandomName();
            APP.data.names[id] = nameToDisplay;
          }
          return `<div class="cat-card data-id="${id}">
                   <img src="${url}" alt="A cool cat named ${nameToDisplay}" class="cat-image"/>
                   <div class="cat-name-container">
                     <h2 class="cat-name">${nameToDisplay}</h2>
                   </div>
                </div>`;
        })
        .join("")
    );
    TODO: if (newEntry) APP.saveToStorage(storageKey, APP.data.names);
  },

  search: function (category) {
    APP.setInnerHTML(APP.html.error, "");
    if (!category) {
      APP.setInnerHTML(APP.html.results, "");
      return;
    }

    const searchURL = new URL(APP.url.search);
    searchURL.searchParams.set(`category_ids`, category);
    searchURL.searchParams.set("limit", 30);
    searchURL.searchParams.set("api_key", APP.key.api);
    APP.spin(true);
    fetch(searchURL, { node: "no-cors" })
      .then((response) => {
        if (!response.ok) throw new NetworkError("Cat fetch failed", response);
        return delay(1000).then(() => response.json());
      })
      .then((data) => {
        APP.showResults(data);
        delay(750).then(() => APP.spin(false));
      })
      .catch((err) => {
        APP.spin(false);
        APP.handleError(err);
      });
  },
  handleError: function (err) {
    if (!APP.html.error) return;
    APP.setInnerHTML(APP.html.error, "");

    let errorMessage = "";
    switch (err.name) {
      case "NetworkError":
        errorMessage = `Network Error. ${
          err.status ? `Status: ` + err.status : ""
        } ${err.statusText ? `Description: ` + err.statusText : ``}`;
        break;
      case "WebError":
        errorMessage = "Web failure. This should not have happened!";
        break;
      default:
        errorMessage = err.message ? err.message : `Error!`;
    }
    if (errorMessage) APP.html.error.innerHTML = errorMessage;
    if (APP.html.category) APP.html.category.focus();
  },
  setInnerHTML: function (element, value = "") {
    if (element) element.innerHTML = value;
  },
  spin: function (show = true) {
    if (!APP.html.overlay) return;
    show
      ? APP.html.overlay.classList.add("active")
      : APP.html.overlay.classList.remove("active");
  },
  readNamesFromStorage: function () {
    const storageKey = APP.key.localStorage + "-names";
    const storageObj = localStorage.getItem(storageKey);
    APP.data.names = storageObj ? JSON.parse(storageObj) : {};
  },
  saveToStorage: function (key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },
};

document.addEventListener("DOMContentLoaded", APP.init);

"use strict";

import { NetworkError, delay, WebError } from "./utils.js";
import pickRandomName from "./catlist.js";

const APP = {
  htmlElements: {
    category: undefined,
    results: undefined,
    error: undefined,
    overlay: undefined,
  },
  urls: {
    categoryURL: new URL(`https://api.thecatapi.com/v1/categories`),
    searchURL: new URL(`https://api.thecatapi.com/v1/images/search`),
  },
  keys: {
    storageKey: `ulut0002-cat`,
    apiKey: `live_TEJ0VjdTT4NGUFndxmOvv1KGNRjSP3VerfWsgKr427PkZq6eEFigHcCw0mkZ6r6a`,
  },
  data: {
    catNames: undefined,
  },

  init: () => {
    APP.htmlElements.category = document.querySelector(
      ".search--category--select"
    );
    APP.htmlElements.results = document.querySelector(".cat-card-container");
    APP.htmlElements.error = document.querySelector(".error--container");
    APP.htmlElements.overlay = document.querySelector(".overlay");

    if (APP.htmlElements.category) {
      APP.htmlElements.category.addEventListener(
        "change",
        APP.handleCategoryChange
      );
    }

    //fetch categories when the page is loaded
    APP.fetchCategories();
  },
  handleCategoryChange: function (ev) {
    if (!APP.htmlElements.category) return;
    APP.search(APP.htmlElements.category.value);
  },
  //fetchCategories reads the local storage first.
  //if there is a saved result, read it from there.
  //if local storage is empty, retrieves categories and save it back to local storage
  fetchCategories: function () {
    //check local storage first
    const storageKey = `${APP.keys.storageKey}-categories`;
    const categoriesObj = localStorage.getItem(storageKey);
    if (categoriesObj) {
      this.displayCategories(JSON.parse(categoriesObj));
      return;
    }

    //local storage is empty. So fetch it from the API
    fetch(APP.urls.categoryURL)
      .then((response) => {
        if (!response.ok)
          throw new NetworkError("Category fetch failed", response);
        // throw new NetworkError("Category fetch failed", response);
        return response.json();
      })
      .then((data) => {
        const obj = JSON.stringify(data);
        APP.displayCategories(data);
        localStorage.setItem(storageKey, obj); //save it back to local storage
      })
      .catch((err) => {
        APP.handleError(err);
      });
  },

  displayCategories: function (categories) {
    if (!APP.htmlElements.category) return;

    APP.htmlElements.category.innerHTML =
      `<option>Select an option</option>` +
      categories
        .map(({ id, name }) => `<option value=${id}>${name}</option>`)
        .join("");
  },

  //retrieves a list of cat objects
  //displays them on the page and then updates the cat names in local storage
  displayResults: function (data) {
    if (!data) {
      return;
    }
    let newEntryAdded = false;
    const storageKey = APP.keys.storageKey + "-names";

    APP.data.catNames = localStorage.getItem(storageKey);
    APP.data.catNames = APP.data.catNames ? JSON.parse(APP.data.catNames) : {};

    const htmlResult = data
      .map(({ id, url }) => {
        let nameToDisplay = "";
        nameToDisplay = APP.data.catNames[id];
        if (!nameToDisplay) {
          newEntryAdded = true;
          nameToDisplay = pickRandomName();
          APP.data.catNames[id] = nameToDisplay;
        }
        return `<div class="cat-card">
                   <img src="${url}" alt="A cool cat named ${nameToDisplay}" class="cat-image"/>
                   <div class="cat-name-container">
                     <h2 class="cat-name">${nameToDisplay}</h2>
                   </div>
                </div>`;
      })
      .join("");
    APP.setResultHTML(htmlResult);
    if (newEntryAdded)
      localStorage.setItem(storageKey, JSON.stringify(APP.data.catNames));
  },
  //this calls the cat-search api based on given category
  //1. show spinner
  //2. do the search
  //3. delay 2 seconds for each search
  //4. displaay results (APP.display results funct)
  //5. delay .5s and remove the spinner
  search: function (category = 0) {
    APP.clearError();
    APP.spin(true);
    if (!category) {
      APP.setResultHTML("");
      return;
    }
    const searchURL = new URL(APP.urls.searchURL);
    searchURL.searchParams.set(`category_ids`, category);
    searchURL.searchParams.set("limit", 30);
    searchURL.searchParams.set("api_key", APP.keys.apiKey);
    fetch(searchURL)
      .then((response) => {
        if (!response.ok) throw new NetworkError("Cat fetch failed", response);
        //return response.json();
        return delay(2000).then(() => response.json());
      })
      .then((data) => {
        APP.displayResults(data);
        delay(500).then(() => APP.spin(false));
      })
      .catch((err) => {
        APP.spin(false);
        APP.handleError(err);
      });
  },
  handleError: function (err) {
    if (!APP.htmlElements.error) return;
    APP.clearError();

    let errorMessage = "";
    switch (err.name) {
      case "NetworkError":
        errorMessage = `Network Error! Status: ${err.status}, Description: ${err.statusText}`;
        break;
      case "WebError":
        errorMessage = "Web failure! This should not have happened!";
        break;
      default:
        console.log("");
        errorMessage = `Error! ${err.message}`;
    }
    if (errorMessage) APP.htmlElements.error.innerHTML = errorMessage;
    if (APP.htmlElements.category) APP.htmlElements.category.focus();
  },
  clearError: function () {
    if (APP.htmlElements.error) APP.htmlElements.error.innerHTML = "";
  },
  setResultHTML: function (val = "") {
    if (APP.htmlElements.results) APP.htmlElements.results.innerHTML = val;
  },
  spin: function (show = true) {
    console.log(APP.htmlElements.overlay);
    if (!APP.htmlElements.overlay) return;
    if (show) {
      APP.htmlElements.overlay.classList.add("active");
    } else {
      APP.htmlElements.overlay.classList.remove("active");
    }
  },
};

document.addEventListener("DOMContentLoaded", APP.init);

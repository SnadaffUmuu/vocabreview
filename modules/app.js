import { MenuView } from "./menu/menu.js";
import { Slider } from "./slider/slider.js";
import { StructureView } from "./structure/structure.js";
import { View } from "./view.js";

const APPLICATION_TYPE = {
  CARDS: 'CARDS',
  TABLE: 'TABLE',
  RAW: 'RAW',
  BOARD: 'BOARD',
  QUIZBOARD: 'QUIZBOARD'
}

export const Application = {
  views: null,
  rawData : null,
  data: null,
  initialState: null,
  initialData : null,
  filteredData : {
    entries : null
  },
  defaultState: {
    nightMode: false
  },

  initViews: async function () {
    this.views = {
      MenuView: await View.create(MenuView),
      SliderView: await View.create(Slider),
    };
  },

  initState: function () {
    this.initialState = this.loadFromLocalStorage('review-state', this.defaultState);
    this.state = new Proxy(Application.initialState, {
      set(target, property, value) {
        target[property] = value;
        Application.saveToLocalStorage('review-state', target);
        return true;
      }
    });
  },

  initData: function () {
    this.rawData = this.loadFromLocalStorage('review-data', {})
    this.data = new Proxy(Application.rawData, {
      set(target, property, value) {
        target[property] = value;
        Application.saveToLocalStorage('review-data', target);
        Router.showDefaultView();
        Application.views.StructureView.render();
        Application.filteredData.entries = null;
        return true;
      }
    });
    this.filteredData = new Proxy(this.filteredData, {
      set(target, property, value) {
        target[property] = value;
        Router.showDefaultView();
        return true;
      },
      get(target, property) {
        return target[property]
      }
    });
  },

  saveToLocalStorage : function (key, data) {
    localStorage.setItem(key, JSON.stringify(data))
  },

  loadFromLocalStorage : function(key, defaultValue) {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  },

};

const Router = {

  applicationType: null,

  start: function () {
    var pathName = window.location.pathname.toLowerCase().replace(/\/app\.html$/, '');
    switch (pathName) {
      case '':
      case 'slider':
        this.applicationType = APPLICATION_TYPE.SLIDER;
        break;
      case 'table':
        this.applicationType = APPLICATION_TYPE.TABLE;
        break;
      case 'raw':
        this.applicationType = APPLICATION_TYPE.RAW;
        break;
      case 'board':
        this.applicationType = APPLICATION_TYPE.BOARD;
        break;
      case 'quizboard':
        this.applicationType = APPLICATION_TYPE.QUIZBOARD;
        break;
      default:
        throw new Error('Unsupported application path');
    }
    this.showMenuView();
    this.showDefaultView();
    console.log('Router started');
  },

  showMenuView: async function () {
    Application.views.MenuView.show();
    Application.views.StructureView = await View.create(StructureView);
    Application.views.StructureView.show();
  },

  showSliderView: function () {
   Application.views.SliderView.show();
  },

  showDefaultView: function () {
    switch (this.applicationType) {
      case APPLICATION_TYPE.SLIDER:
        this.showSliderView();
        break;
      /*
    case APPLICATION_TYPE.TABLE:
      this.showTableView();
      break;
    case APPLICATION_TYPE.RAW:
      this.showRawView();
      break;
    case APPLICATION_TYPE.BOARD:
      this.showBoardView();
      break;
    case APPLICATION_TYPE.QUIZBOARD:
      this.showQuizboardView();
      break;
      */
      default:
        throw new Error('Unsupported application type');
    }
  },

};

document.addEventListener("DOMContentLoaded", async function (event) {
  Application.initData();
  Application.initState();
  await Application.initViews();
  Router.start();
});

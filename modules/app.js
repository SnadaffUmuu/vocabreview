import { MenuView } from "./menu/menu.js";
import { Slider } from "./slider/slider.js";
import { StructureView } from "./structure/structure.js";
import { InfobarView } from "./infobar/infobar.js";
import { View } from "./view.js";
import { DataFactory } from "./data.js"

const APPLICATION_TYPE = {
  CARDS: 'CARDS',
  TABLE: 'TABLE',
  RAW: 'RAW',
  BOARD: 'BOARD',
  QUIZBOARD: 'QUIZBOARD'
}

export const Application = {
  views: null,
  rawData: null,
  data: {
    allEntries: null,
    currentEntries: null,
    excludedEntries: null,
    excludedLines: null
  },
  initialState: null,
  initialData: {},
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
        if ('source' == property) {
          const { excludedEntries, excludedLines, structure, allEntries } = DataFactory.parse(Application.rawData);
          Object.assign(Application.data, { excludedEntries, excludedLines, structure, allEntries });
        }
        return true;
      },
      get(target, property) {
        return target[property]
      },
      deleteProperty(target, property) {
        if (property in target) {
          delete target[property];
          if ('source' == property) {
            Application.saveToLocalStorage('review-state', Application.defaultState);
            delete Application.data.allEntries;
          }
        }
        return true;
      }
    });
  },

  initData: function () {
    this.data = new Proxy(Application.initialData, {
      set(target, property, value) {
        target[property] = value;
        if ('allEntries' == property) {
          Application.saveToLocalStorage('review-data', target);
          Application.data.currentEntries = Application.data.allEntries
        } else if ('currentEntries' == property) {
          Router.showDefaultView();
          //Application.views.StructureView.render();
        }
        return true;
      },
      get(target, property) {
        return target[property]
      },
      deleteProperty(target, property) {
        if (property in target) {
          delete target[property];
          if ('allEntries' == property) {
            localStorage.removeItem('review-data');
            if (Application.data.currentEntries) {
              delete Application.data.currentEntries;
            }
          } else if ('currentEntries' == property) {
            Router.resetViews();
          }
        }
        return true
      }
    });
    const { excludedEntries, excludedLines, structure, allEntries } = this.loadFromLocalStorage('review-data', {});
    Object.assign(this.data, { excludedEntries, excludedLines, structure, allEntries });
  },

  saveToLocalStorage: function (key, data) {
    localStorage.setItem(key, JSON.stringify(data))
  },

  loadFromLocalStorage: function (key, defaultValue) {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  },

  changeSource: function (name) {
    const request = new XMLHttpRequest();
    request.open('GET', './vocab/' + name + '.txt', true);
    request.onload = function () {
      if (request.responseText) {
        Application.rawData = request.responseText;
        Application.state.source = name;
        Application.views.StructureView.render();
      }
    }.bind(this);
    request.send();
  },

};

const Router = {

  applicationType: null,

  start: function () {
    const pathName = window.location.pathname.toLowerCase().replace(/\/app\.html$/, '');
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
    Application.initData();
    this.showMenuView();
  },

  showMenuView: async function () {
    Application.views.MenuView.show();
    Application.views.StructureView = await View.create(StructureView);
    Application.views.StructureView.show();
    Application.views.InfobarView = await View.create(InfobarView);
    Application.views.InfobarView.show();
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

  resetViews : function() {
    Application.views.InfobarView.remove();
    Application.views.StructureView.remove();
    Application.views.MenuView.remove();
    Application.views.SliderView.remove();
    this.start();
    Application.views.MenuView.toggleMenu();
  }

};

document.addEventListener("DOMContentLoaded", async function (event) {
  //Application.initData();
  Application.initState();
  await Application.initViews();
  Router.start();
});

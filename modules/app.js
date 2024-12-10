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
  defaultState: {
    nightMode: false
  },
  initialState: null,
  initialData: {},
  data: {
    allEntries: [],
    currentEntries: [],
    excludedEntries: [],
    excludedLines: []
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
          Object.assign(Application.data, { 
            excludedEntries, 
            excludedLines, 
            structure, 
            allEntries 
          });
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
    Object.assign(
      this.initialData, 
      this.loadFromLocalStorage('review-data', {})
    );

    this.data.excludedLines = this.initialData.excludedLines;
    this.data.excludedEntries = this.initialData.excludedEntries;
    this.data.allEntries = this.initialData.allEntries;
    this.data.structure = this.initialData.structure;

    this.data = new Proxy(Application.initialData, {
      set(target, property, value) {
        target[property] = value;
        if ('allEntries' == property) {
          Application.saveToLocalStorage('review-data', target);
          Router.renderMenuView();
          Router.renderCurrentView();
        } else if ('currentEntries' == property) {
          Application.views.InfobarView.render();
          Router.renderCurrentView();
        }
        return true;
      },
      get(target, property) {
        if (property == 'currentEntries') {
          return target.currentEntries?.length ? 
          target.currentEntries : target.allEntries
        } else {
          return target[property]
        }
      },
      deleteProperty(target, property) {
        if (property in target) {
          if ('allEntries' == property) {
            localStorage.removeItem('review-data');
            if (Application.initialData.currentEntries) {
              delete Application.data.currentEntries;
            }
            Router.resetViews();
          } else {
            delete target[property];
          }
        }
        return true
      }
    });
  },

  saveToLocalStorage: function (key, data) {
    localStorage.setItem(key, JSON.stringify(data))
  },

  loadFromLocalStorage: function (key, defaultValue) {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  },

  changeSource: function (name) {
    if ('' == name) {
      this.reset();
    }
    const request = new XMLHttpRequest();
    request.open('GET', './vocab/' + name + '.txt', true);
    request.onload = function () {
      if (request.responseText) {
        Application.rawData = request.responseText;
        Application.state.source = name;
      }
    }.bind(this);
    request.send();
  },

  reset : function() {
    delete this.state.source
  },

  filter : function(data) {
    if (!data || !data.length) {
      this.data.currentEntries = [];
      return;
    }
    const res = DataFactory.filter(data);
    this.data.currentEntries = res;
  }

};

const Router = {

  applicationType: null,
  currentView : null,

  start: function () {
    const pathName = window.location.pathname.toLowerCase().replace(/\/app\.html$/, '');
    switch (pathName) {
      case '':
      case 'slider':
        this.applicationType = APPLICATION_TYPE.SLIDER;
        this.currentView = Application.views.SliderView;
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
    this.showCurrentView();
  },

  showMenuView: async function () {
    Application.views.MenuView.show();
    Application.views.StructureView = await View.create(StructureView);
    Application.views.StructureView.show();
    Application.views.InfobarView = await View.create(InfobarView);
    Application.views.InfobarView.show();
  },

  renderMenuView: async function () {
    //Application.views.MenuView.render();
    Application.views.StructureView.render();
    Application.views.InfobarView.render();
  },
  
  resetMenuView : function () {
    Application.views.MenuView.reset();
    Application.views.StructureView.reset();
    Application.views.InfobarView.reset();
  },

  showCurrentView : function () {
    this.currentView.show()
  },

  renderCurrentView : function () {
    this.currentView.render()
  },

  resetCurrentView : function() {
    this.currentView.reset()
  },

  resetViews : function() {
    this.resetMenuView();
    this.currentView.reset();
    Application.views.MenuView.toggleMenu();
  }

  /*
  showDefaultView: function () {
    switch (this.applicationType) {
      case APPLICATION_TYPE.SLIDER:
        this.showSliderView();
        break;
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
      default:
        throw new Error('Unsupported application type');
      }
    },

    showSliderView: function () {
      Application.views.SliderView.show();
    }
  */

};

document.addEventListener("DOMContentLoaded", async function (event) {
  Application.initState();
  Application.initData();
  await Application.initViews();
  Router.start();
});

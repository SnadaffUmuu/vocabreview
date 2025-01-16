import { MenuView } from "./menu/menu.js";
import { Slider } from "./slider/slider.js";
import { DataView } from "./data-view/data-view.js";
import { StructureView } from "./structure/structure.js";
import { InfobarView } from "./infobar/infobar.js";
import { View } from "./view.js";
import { Element } from "./element.js";
import { DataFactory } from "./data.js"
import { DataTests } from "./data-view/data-tests.js"
import { TableView } from "./table/table.js";
import { PreloaderView } from "./preloader/preloader.js";
import { SlideSide } from "./slide/slide-side.js";
import { Slide } from "./slide/slide.js";

const APPLICATION_TYPE = {
  CARDS: 'SLIDER',
  TABLE: 'TABLE',
  DATA: 'DATA',
  BOARD: 'BOARD',
  QUIZBOARD: 'QUIZBOARD'
}

export const Application = {
  views: null,
  protoElements: null,
  rawData: null,
  defaultState: {
    nightMode: false,
    appType : 'slider'
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
      PreloaderView : await View.create(PreloaderView),
      MenuView: await View.create(MenuView),
      SliderView: await View.create(Slider),
      TableView: await View.create(TableView),
      DataView: await View.create(DataView),
    };
  },
  
  initProtoElements: async function() {
    this.protoElements = {
      ProtoSlideSideElement : await Element.create(SlideSide),
      ProtoSlideElement : await Element.create(Slide),
    }
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
           allEntries,
         });

        } else if ('appType' == property) {
          Router.switchView();
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
    this.data.currentEntries = this.initialData.currentEntries;
    this.data.structure = this.initialData.structure;

    if (this.data.allEntries?.length > 100 && !this.data.currentEntries?.length) {
      //filtering the latest section only
      const firstNode = this.data.structure[0].children ? this.data.structure[0].children[0].id : this.data.structure[0].id;
      this.data.currentEntries = this.data.allEntries.filter(entry => entry.section == firstNode);
      Application.saveToLocalStorage('review-data', this.data);
    }

    this.data = new Proxy(Application.initialData, {
      set(target, property, value) {
        target[property] = value;
        if ('allEntries' == property) {
          delete Application.data.currentEntries;
          Application.saveToLocalStorage('review-data', target);
          if (value.length > 100 && !Application.initialData.currentEntries?.length) {
            const firstNode = Application.data.structure[0].children ? Application.data.structure[0].children[0].id : Application.data.structure[0].id;
            Application.initialData.currentEntries = value.filter(entry => entry.section == firstNode);
            Application.saveToLocalStorage('review-data', Application.data);
          }
          Router.renderMenuView();
          Router.renderCurrentView();
        } else if ('currentEntries' == property) {
          Application.saveToLocalStorage('review-data', target);
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
            delete target[property];
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

  getFilteredEntries : function () {
    return (Application.initialData.currentEntries?.length ? Application.initialData.currentEntries : [])
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
  },

  switchView : function(name) {
    if (name) {
      Application.state.appType = name;
    }
  },

};

const Router = {

  applicationType: null,
  currentView : null,

  defineCurrentView : function (type) {
    switch (type) {
      case '':
      case 'slider':
        this.applicationType = APPLICATION_TYPE.SLIDER;
        this.currentView = Application.views.SliderView;
        break;
      case 'table':
        this.applicationType = APPLICATION_TYPE.TABLE;
        this.currentView = Application.views.TableView;
        break;
      case 'data':
        this.applicationType = APPLICATION_TYPE.DATA;
        this.currentView = Application.views.DataView;
        break;
      case 'board':
        this.applicationType = APPLICATION_TYPE.BOARD;
        break;
      case 'quizboard':
        this.applicationType = APPLICATION_TYPE.QUIZBOARD;
    }
  },

  start: function () {
    this.defineCurrentView(Application.state.appType ? Application.state.appType : '');
    this.showMenuView();
    this.showCurrentView();
  },
  
  switchView : function() {
    this.currentView.remove();
    this.defineCurrentView(Application.state.appType ? Application.state.appType : '');
    this.showCurrentView();
  },

  showMenuView: async function () {
    Application.views.MenuView.show();
    Application.views.StructureView = await View.create(StructureView);
    Application.views.StructureView.show();
    Application.views.InfobarView = await View.create(InfobarView);
    Application.views.InfobarView.show();
  },

  renderMenuView: function () {
    Application.views.StructureView.render();
    Application.views.InfobarView.render();
  },
  
  resetMenuView : function () {
    Application.views.MenuView.reset();
    Application.views.StructureView.reset();
    Application.views.InfobarView.reset();
  },

  showCurrentView : function () {
    const startTime = performance.now();

    this.currentView.show();

    const duration = performance.now() - startTime;
    console.log(`showCurrentView took ${duration}ms`);

  },

  renderCurrentView : function () {

    const startTime = performance.now();
    this.currentView.render()

    const duration = performance.now() - startTime;
    console.log(`renderCurrentView took ${duration}ms`);
  },

  resetCurrentView : function() {
    this.currentView.reset()
  },

  resetViews : function() {
    this.resetMenuView();
    this.currentView.reset();
    Application.views.MenuView.toggleMenu();
  }

};

document.addEventListener("DOMContentLoaded", async function (event) {
  Application.initState();
  Application.initData();
  await Application.initProtoElements();
  await Application.initViews();
  Router.start();
  window.App = Application;
  window.DF = DataFactory;
  window.DT = DataTests;
});

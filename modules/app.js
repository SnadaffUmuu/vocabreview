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
import { BoardView } from "./board/board.js";

const APPLICATION_TYPE = {
  CARDS: 'SLIDER',
  TABLE: 'TABLE',
  DATA: 'DATA',
  BOARD: 'BOARD',
}

export const Application = {
  views: null,
  protoElements: null,
  currentRawData: null,
  defaultState: {
    nightMode: false,
    appType: 'slider',
    views: {},
  },
  currentSource: null,
  initialState: null,
  initialData: {},
  data: {},

  initViews: async function () {
    this.views = {
      PreloaderView: await View.create(PreloaderView),
      MenuView: await View.create(MenuView),
      SliderView: await View.create(Slider),
      TableView: await View.create(TableView),
      DataView: await View.create(DataView),
      BoardView: await View.create(BoardView),
    };
  },

  initProtoElements: async function () {
    this.protoElements = {
      ProtoSlideSideElement: await Element.create(SlideSide),
      ProtoSlideElement: await Element.create(Slide),
    }
  },

  initState: function () {
    const initialState = this.loadFromLocalStorage('review-state');
    if (!initialState) {
      this.initialState = this.defaultState;
      this.saveToLocalStorage('review-state', this.initialState);
    } else {
      this.initialState = initialState;
    }
    const self = this;
    this.state = new Proxy(self.initialState, {
      set(target, property, value) {
        target[property] = value;
        self.saveToLocalStorage('review-state', target);
        if ('currentSource' == property) {
          let currData = self.initialData[value];
          if (!currData) {
            const {
              excludedEntries,
              excludedLines,
              structure,
              allEntries
            } = DataFactory.parse(self.currentRawData);

            currData = {
              excludedEntries,
              excludedLines,
              structure,
              allEntries
            }
            self.initialData[value] = currData;
          }

          //no proxy is set for this source key, so setting proxy:
          if (!self.data[value]) { 
            self.data[value] = new Proxy(
              self.initialData[value],
              self.getSourceDataProxy(self, value)
            )
          } 
          //chage property to trigger trap
          Object.assign(self.data[value], self.initialData[value]);

        } else if ('appType' == property) {
          Router.switchView();
        }
        return true;
      },
      get(target, property) {
        return target[property]
      },
      deleteProperty(target, property) {
        if (!(property in target)) {
          console.log(`property not found: ${property}`);
          return false;
        }
        delete target[property];
        if ('currentSource' == property) {
          self.saveToLocalStorage('review-state', self.defaultState);
          for (let source in self.data) {
            delete self.data[source].allEntries;
          }
        }
        return true;
      }
    });
  },

  getSourceDataProxy: function (self, source) {
    return {
      set(target, property, value) {
        target[property] = value;
        if ('allEntries' == property) {

          if (self.initialData[source]?.currentEntries) {
            delete self.initialData[source].currentEntries;
          }

          self.saveToLocalStorage('review-data', self.initialData);

          if (value.length > 100) {
            const firstNode = self.data[source].structure[0].children ?
              self.data[source].structure[0].children[0].id
              : self.data[source].structure[0].id;

            self.initialData[source].currentEntries = value.filter(entry =>
              entry.section == firstNode).map(entry => entry.originalIndex);

            self.saveToLocalStorage('review-data', self.initialData);
          }
          Router.renderMenuView();
          Router.renderCurrentView(true);

        } else if ('currentEntries' == property) {
          self.saveToLocalStorage('review-data', self.initialData);
          self.views.InfobarView.render();
          Router.renderCurrentView(true);
        }
        return true;
      },
      get(target, property) {
        if (property == 'currentEntries') {
          return target.currentEntries?.length ?
            self.initialData[source].allEntries.filter(entry => 
              self.initialData[source]?.currentEntries.includes(entry.originalIndex)) : []
        } else {
          return target[property]
        }
      },
      deleteProperty(target, property) {
        if (!(property in target)) {
          console.log(`property not found: ${property}`);
          return false;
        }
        delete target[property];
        if ('allEntries' == property) {
          localStorage.removeItem('review-data');
          if (self.initialData[source]?.currentEntries) {
            delete self.initialData[source].currentEntries;
          }
          Router.resetViews();
        }
        return true;
      }
    }
  },

  initData: function () {
    const self = this;
    Object.assign(
      this.initialData,
      this.loadFromLocalStorage('review-data', {})
    );
    for (let source in this.initialData) {
      if (this.initialData[source].allEntries?.length > 100
        && !this.initialData[source].currentEntries?.length) {
        //filtering the latest section only
        const firstNode = this.initialData[source].structure[0].children ?
          this.initialData[source].structure[0].children[0].id : this.initialData[source].structure[0].id;
        this.initialData[source].currentEntries = this.initialData[source].allEntries
          .filter(entry => entry.section == firstNode);
      }
    }

    this.saveToLocalStorage('review-data', this.initialData);

    for (let source in this.initialData) {
      const currentSource = source;
      this.data[currentSource] = new Proxy(
        self.initialData[currentSource],
        this.getSourceDataProxy(self, source)
      );
    }
  },

  setViewState: function (instance) {
    const stateViews = this.state.views || {};
    stateViews[instance._class.name] = instance.initialState;
    this.state.views = stateViews;
  },

  getViewState: function (instance) {
    if (!this.state.views) return null;
    return this.state.views[instance._class.name] || null;
  },

  saveToLocalStorage: function (key, data) {
    localStorage.setItem(key, JSON.stringify(data))
  },

  loadFromLocalStorage: function (key, defaultValue) {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  },

  changeSource : function (sourceName) {
    if (!this.data[sourceName]) {
      this.loadAndSetCurrentSource(sourceName);
    } else {
      Application.state.currentSource = sourceName;
    }
  },

  loadAndSetCurrentSource: function (name) {
    if ('' == name) {
      this.reset();
    }
    const now = new Date().getMilliseconds();
    const request = new XMLHttpRequest();
    request.open('GET', './vocab/' + name + '.txt?n=' + now, true);
    request.onload = function () {
      if (request.responseText) {
        Application.currentRawData = request.responseText;
        Application.state.currentSource = name;
      }
    }.bind(this);
    request.send();
  },

  reset: function () {
    if (this.state.currentSource) {
      delete this.state.currentSource
    }
    if (this.state.views) {
      delete this.state.views
    }
  },

  filter: function (data) {
    if (!data || !data.length) {
      this.getCurrentSourceData().currentEntries = [];
      return;
    }
    const res = this.getCurrentSourceData().allEntries.filter(entry =>
      data.includes(entry.section)).map(entry => entry.originalIndex);
    this.getCurrentSourceData().currentEntries = res;
  },

  switchView: function (name) {
    if (name) {
      this.state.appType = name;
    }
  },

  getCurrentSourceData: function () {
    return this.data[this.state.currentSource]
  },

};

const Router = {

  applicationType: null,
  currentView: null,

  defineCurrentView: function (type) {
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
        this.currentView = Application.views.BoardView;
        break;
    }
  },

  start: function () {
    this.defineCurrentView(Application.state.appType ? Application.state.appType : '');
    this.showMenuView();
    this.showCurrentView();
  },

  switchView: function () {
    this.currentView && this.currentView.remove();
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

  resetMenuView: function () {
    Application.views.MenuView.reset();
    Application.views.StructureView.reset();
    Application.views.InfobarView.reset();
  },

  showCurrentView: function () {
    if (!this.currentView || !this.currentView.show) {
      console.log('current view is not found');
      return;
    }
    this.currentView.show();
  },

  renderCurrentView: function (resetAll) {
    this.currentView.render(resetAll)
  },

  resetCurrentView: function () {
    this.currentView.reset()
  },

  resetViews: function () {
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

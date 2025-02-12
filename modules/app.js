import { View } from "./view.js";
import { Router } from "./router.js";
import { MenuView } from "./menu/menu.js";
import { Slider } from "./slider/slider.js";
import { DataView } from "./data-view/data-view.js";
import { Element } from "./element.js";
import { DataFactory } from "./data.js"
import { DataTests } from "./data-view/data-tests.js"
import { TableView } from "./table/table.js";
import { PreloaderView } from "./preloader/preloader.js";
import { SlideSide } from "./slide/slide-side.js";
import { Slide } from "./slide/slide.js";
import { BoardView } from "./board/board.js";
import { setDeep } from "./utils.js";

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
  initialState: {
    selfUpdate: false,
  },
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
        //console.log(`App state: Set triggered for ${property}:`, value);
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

          //if (!self.data[value]) {
          self.data[value] = new Proxy(
            self.initialData[value],
            self.getSourceDataProxy(self)
          )
          //}
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
        if (target[property]) {
          delete target[property];
          if ('currentSource' == property) {
            self.saveToLocalStorage('review-state', self.defaultState);
            for (let source in self.data) {
              delete self.data[source]?.allEntries;
              delete self.data[source];
            }
          }
        }
        return true;
      }
    });
  },

  getSourceDataProxy: function (self) {
    return {
      set(target, property, value) {
        target[property] = value;
        if ('allEntries' == property) {

          /*
          if (self.initialData[source]?.currentEntries) {
            delete self.initialData[source]?.currentEntries;
          }
          */

          self.saveToLocalStorage('review-data', self.initialData);

          if (value.length > 100
            && !target.currentEntries?.length) {
            const firstNode = target.structure[0].children ?
              target.structure[0].children[0].id
              : target.structure[0].id;

            target.currentEntries = value.filter(entry =>
              entry.section == firstNode).map(entry => entry.originalIndex);

          } else if (!target.currentEntries?.length) {
            target.currentEntries = value.map(entry => entry.originalIndex);
          }
          self.initialData[self.state.currentSource] = target;
          self.saveToLocalStorage('review-data', self.initialData);
          Router.renderMenuView();
          //Router.renderCurrentView(true);
          Router.renderCurrentView();

        } else if ('currentEntries' == property) {
          self.saveToLocalStorage('review-data', self.initialData);
          self.views.InfobarView.render();
          //Router.renderCurrentView(true);
          Router.renderCurrentView();
        }
        return true;
      },
      get(target, property) {
        if (property == 'currentEntries') {
          return target.currentEntries?.length ?
            target.allEntries.filter(entry =>
              target.currentEntries.includes(entry.originalIndex)) : []
        } else {
          return target[property]
        }
      },
      deleteProperty(target, property) {
        if (target[property]) {
          delete target[property];
          if ('allEntries' == property) {
            localStorage.removeItem('review-data');
            delete target.currentEntries;
            delete target.structure;
            delete target.excludedEntries;
            delete target.excludedLines;
            Router.resetViews();
          }
          if (self.state.currentSource) {
            debugger;
            self.initialData[self.state.currentSource] = target;
          }
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
      const thisSource = source;

      if (this.initialData[thisSource].allEntries) {
        if (this.initialData[thisSource].allEntries?.length > 100
          && !this.initialData[thisSource].currentEntries?.length) {

          //filtering the latest section only
          const firstNode = this.initialData[thisSource].structure[0].children ?
            this.initialData[thisSource].structure[0].children[0].id
            : this.initialData[thisSource].structure[0].id;
          this.initialData[thisSource].currentEntries = this.initialData[thisSource].allEntries
            .filter(entry => entry.section == firstNode).map(entry => entry.originalIndex);

        } else if (!this.initialData[thisSource].currentEntries?.length) {

          this.initialData[thisSource].currentEntries = this.initialData[thisSource]
            .allEntries.map(entry => entry.originalIndex);
        }
      }
    }

    this.saveToLocalStorage('review-data', this.initialData);

    for (let source in this.initialData) {
      const currentSource = source;
      this.data[currentSource] = new Proxy(
        self.initialData[currentSource],
        this.getSourceDataProxy(self)
      );
    }
  },

  setViewState: function (instance) {
    setDeep(
      this.state,
      ['views', this.state.currentSource, instance._class.name],
      instance.initialState
    );
  },

  getViewState: function (instance) {
    return this.state.views[this.state.currentSource]?.[instance._class.name] ?? null
  },

  saveToLocalStorage: function (key, data) {
    localStorage.setItem(key, JSON.stringify(data))
  },

  loadFromLocalStorage: function (key, defaultValue) {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  },

  changeSource: function (sourceName) {
    if (!this.initialData[sourceName]?.allEntries) {
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
        this.currentRawData = request.responseText;
        delete this.initialData[name];
        this.state.currentSource = name;
      }
    }.bind(this);
    request.send();
  },

  loadAllSources: async function () {
    const promises = DataFactory.vocabFilesIndex.map(async (source) => {
      if (!this.data[source] || !this.data[source].allEntries?.length) {
        const now = new Date().getMilliseconds();
        const response = await fetch(`./vocab/${source}.txt?n=${now}`);
        if (response.ok) {
          const text = await response.text();
          const { excludedEntries, excludedLines, structure, allEntries } = DataFactory.parse(text);
          this.initialData[source] = { excludedEntries, excludedLines, structure, allEntries };
          this.data[source] = new Proxy(this.initialData[source], this.getSourceDataProxy(this));
        }
      }
    });
    await Promise.all(promises);
    Application.views.PreloaderView.hidePreloader();
    this.saveToLocalStorage('review-data', this.initialData);
  },

  reset: function () {
    delete this.state.currentSource
    this.state.views = {}
  },

  filter: function (data) {
    if (!data || !data.length) {
      this.getCurrentSourceData().currentEntries = [];
      return;
    }
    const res = this.getCurrentSourceData().allEntries.filter(entry =>
      data.includes(entry.section)).map(entry => entry.originalIndex);
    if (Router.currentView.handleFilter) {
      Router.currentView.handleFilter();
    }
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

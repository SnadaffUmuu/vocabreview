import { DataFactory } from "../data.js";
import { View } from "../view.js";
import {
  speak,
  UserActionHandlers,
  shuffleArray,
  setSelectOption,
  stringToHash,
} from "../utils.js";
import { Application } from "../app.js";

export const MatchView = function () {

  this.namespaces = {
    'UserActionHandlers': UserActionHandlers
  }  

  this.events = {
  }  

  this.renderedEvents = {}

  this.reset = function (resetAll) {
    this.col1.innerHTML = '';
    this.col2.innerHTML = '';
    setSelectOption(this.matchActions, '');
    if (resetAll == true) {
    }
    this.data = {};
  };

  this.render = function (resetAll) {
    this.reset(resetAll);
    this.initState();
    if (!Application.getCurrentSourceData()?.currentEntries.length) {
      if (Application.views.PreloaderView.isShown()) {
        Application.views.PreloaderView.hide();
      }
      return
    }
    this.data.entries = structuredClone(
      Application.getCurrentSourceData().currentEntries
    );

    // if (this.state.mode) {
    //   Array.from(this.cardModeEl.querySelectorAll('option')).forEach(op => {
    //     op.selected = op.value == this.state.mode;
    //   })
    // }
    // this.state.lineIndexes ??= {};
    // this.state.itemsInBoxes ??= {};
    // this.state.removedItems ??= [];
    this.renderMatcher();
    //this.setPanelLayout();

    if (!this.renderedEventSet) {
      this.setRenderedEvents([
        this.col1,
        this.col2,
      ]);
      this.renderedEventSet = true;
    }
    Application.views.PreloaderView.hidePreloader();
  }  

  this.show = function () {
    View.prototype.show.call(this);
    // this.cardModeEl = this.element.querySelector('#cardMode');
    this.col1 = this.element.querySelector('#matchCol1');
    this.col2 = this.element.querySelector('#matchCol2');
    this.matchActions = this.element.querySelector("#matchActions");
    this.renderedEventSet = null;
    this.render();
  }
}

MatchView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templatePath: 'modules/match/match.html',
  templateSelector: '#MatchView',
  longtouchTimeout: 100,
});

MatchView.prototype.constructor = MatchView;
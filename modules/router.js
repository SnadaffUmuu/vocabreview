import { StructureView } from "./structure/structure.js";
import { InfobarView } from "./infobar/infobar.js";
import { View } from "./view.js";
import { Application } from "./app.js";

export const Router = {

  currentView: null,

  defineCurrentView: function (type) {
    switch (type) {
      case '':
      case 'slider':
        this.currentView = Application.views.SliderView;
        break;
      case 'table':
        this.currentView = Application.views.TableView;
        break;
      case 'data':
        this.currentView = Application.views.DataView;
        break;
      case 'board':
        this.currentView = Application.views.BoardView;
        break;
      case 'panel':
        this.currentView = Application.views.PanelView;
        break;
      case 'match':
        this.currentView = Application.views.MatchView;
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
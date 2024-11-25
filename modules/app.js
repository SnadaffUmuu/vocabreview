import * as Utils from "./utils.js";
import * as DataUtils from "./datautils.js";
import { MenuView } from "./menu/menu.js";

const APPLICATION_TYPE = {
  CARDS : 'CARDS',
  TABLE : 'TABLE',
  RAW : 'RAW',
  BOARD : 'BOARD',
  QUIZBOARD : 'QUIZBOARD'
}

const Application = {
  views: null,
  data: null,
  state:null,
  initViews: async function () {
    this.views = {
      MenuView: await MenuView.create()
    };
  },
  initData : function () {
    this.state = localStorage.getItem('review-state')
      ? JSON.parse(localStorage.getItem('review-state')) : {};
    this.data = localStorage.getItem('review-data')
    ? JSON.parse(localStorage.getItem('review-data')) : {};
  }
};

const Router = {

  applicationType: null,

  start: function () {
    var pathName = window.location.pathname.toLowerCase().replace(/\/app\.html$/, '');
    switch (pathName) {
      case '':
      case 'cards':
        this.applicationType = APPLICATION_TYPE.CARDS;
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

  showMenuView: function() {
    Application.views.MenuView.show();
  },

  showDefaultView: function () {
    switch (this.applicationType) {
      case APPLICATION_TYPE.CARDS:
        //this.showCardsView();
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

  showCardView: function () {

  },

};

document.addEventListener("DOMContentLoaded", async function (event) {
  Application.initData();
  await Application.initViews();
  Router.start();
  console.log(Application.views);
});

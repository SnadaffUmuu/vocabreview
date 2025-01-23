import { View } from "../view.js";
import {
  speak,
  UserActionHandlers,
} from "../utils.js";
import { Application } from "../app.js";
import { DataFactory } from "../data.js";

export const BoardView = function () {
  this.actionsContainer = null;

  this.events = {
  };

  this.namespaces = {
    'UserActionHandlers': UserActionHandlers
  },

  this.renderedEvents = {
    click: {
    },
    contextmenu: {
      'tbody': 'UserActionHandlers.preventDefault',
    },
    dragstart: {
    },
    dragenter: {
    },
    dragleave: {
    },
    dragover: {
    },
    dragend: {
    },
    drop: {
    },
    touchstart: {
    },
    touchmove: {
    },
    touchend: {
    },
  };

  this.initSourceWall = function () {
    const wall = new Freewall('#' + this.sourceCardsContainer.id);
    this.sourcesWall = wall;
    wall.reset({
      draggable: true,
      selector: '.boardItem',
      animate: true,
      onResize: function() {
        wall.refresh();
      },
      onBlockMove: function() {
        console.log(this);
      }
    });
    wall.fitWidth();
    $(window).trigger("resize");
  };

  this.handleStateChange = function (newState, prop, value) {
  };  

  this.renderBoard = function () {
    const container = this.sourceCardsContainer;
    const entries = this.data.entries;
    const handleTemplate = `<span class="dragHandle">✥</span>`
    const items = entries.map(e => {
        const linesHtml = e.lines.map((l, i) => {
          const attrs = {
            originalIndex : l.originalIndex
          };
          if (l.speakable) {
            attrs.speakable = 'true';
          }
          if (l.role) {
            attrs.role = l.role;
          }
          if (l.reading) {
            attrs.reading = l.reading;
          }
          if (i == 0) {
            attrs.current = true;
          }
          let attrsParsed = '';
          for (let attr in attrs) {
            attrsParsed += ` ${attr}="${attrs[attr]}"`;
          }
          return `
            <div class="itemLine" ${attrsParsed}>
              ${l.text}
            </div>`;
        }).join('');
        return `<div class="boardItem">${handleTemplate}
          ${linesHtml}
        </div>`;
      }
    );
    items.forEach(itemHtml => {
      container.insertAdjacentHTML('beforeend', itemHtml);
    });
    this.sourceItems = Array.from(container.querySelectorAll('.boardItem'));
    //this.initSourceWall();
  };  

  this.reset = function (resetAll) {
    this.data = {};
    this.sourceCardsContainer.innerHTML = '';
    this.goodCol.innerHTML = '';
    this.failedCol.innerHTML = '';
    if (resetAll) {
    }    
  };  

  this.render = function (resetAll) {
    this.reset(resetAll);
    if (!Application.data.currentEntries?.length) {
      if (Application.views.PreloaderView.isShown()) {
        Application.views.PreloaderView.hide();
      }
      return
    }
    this.data.entries = Application.data.currentEntries;
    this.renderBoard();
    //this.setRenderedEvents(this.tableEl);
    Application.views.PreloaderView.hidePreloader();
  }  

  this.show = function () {
    View.prototype.show.call(this);
    this.sourceCardsContainer = this.element.querySelector('#boardSourceCards');
    this.goodCol = this.element.querySelector('#boardGoodCol');
    this.failedCol = this.element.querySelector('#boardFailedCol');
    this.render();
  }  
}

BoardView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templatePath: 'modules/board/board.html',
  templateSelector: '#boardView',
  longtouchTimeout: 1000,
});

BoardView.prototype.constructor = BoardView;
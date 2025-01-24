import { View } from "../view.js";
import {
  speak,
  UserActionHandlers,
  getDragAfterElement,
  createPlaceholder,
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
    /*
    click: {
    },
    */
    contextmenu: {
      '#boardSourceCards' : 'UserActionHandlers.preventDefault',
      '#boardGoodCol' : 'UserActionHandlers.preventDefault',
      '#boardFailedCol' : 'UserActionHandlers.preventDefault',
    },
    dragstart: {
      '.boardItem' : 'itemDragStart'
    },
    dragend: {
      '.boardItem' : 'itemDragEnd'
    },
    dragover: {
      '#boardSourceCards' : 'setDragOver true',
      '#boardGoodCol' : 'setDragOver true',
      '#boardFailedCol' : 'setDragOver true',
    },
    touchstart: {
      '.boardItem' : 'setTouchStart',
    },
    touchmove: {
      '.boardItem' : 'setTouchMove',
    },
    touchend: {
      '.boardItem' : 'setTouchEnd',
    },
  };

  this.setTouchStart = function (e) {
    this.touchTimeout = setTimeout(() => {
      this.draggable = true;
      e.target.classList.add("dragging");
    }, this.longtouchTimeout);
  },

  this.setTouchMove = function (e) {
    console.log('touchmove')
    const item = e.target;
    if (!this.draggable) {
      e.stopPropagation();
      clearTimeout(this.touchTimeout)
    } else {
      this.draggedItem = item;
      if (!this.placeholder) {
        this.placeholder = createPlaceholder(item.querySelector('[current]'));
      }
      const touch = e.touches[0];
      item.style.left = `${touch.clientX + 10}px`;
      item.style.top = `${touch.clientY + 10}px`;
      const elFromPoint = document
        .elementFromPoint(touch.clientX, touch.clientY);
      this.potentialContainer = elFromPoint.closest('.itemDroppableContainer');
      if (this.potentialContainer && this.placeholder) {
        const afterElement = getDragAfterElement(
          this.potentialContainer,
          touch.clientY,
          touch.clientX
        );
        if (afterElement) {
          this.potentialContainer.insertBefore(this.placeholder, afterElement);
        } else {
          this.potentialContainer.appendChild(this.placeholder);
        }
      }
      e.preventDefault();
    }    
  },

  this.setTouchEnd = function (e) {
    clearTimeout(this.touchTimeout);
    this.draggable = false;
    e.target.classList.remove("dragging");
    if (this.draggedItem && this.placeholder && this.placeholder.parentNode) {
      this.placeholder.parentNode.insertBefore(this.draggedItem, this.placeholder);

      this.placeholder.remove();
      this.draggedItem.style.left = "";
      this.draggedItem.style.top = "";
    }
    this.draggedItem = null;
    this.placeholder = null;    
  },

  this.itemDragStart = function (e) {
    console.log('dragstart', e.currentTarget, e.target)
    e.target.classList.add('dragging')
  },
  
  this.itemDragEnd = function (e) {
    console.log('dragend', e.currentTarget, e.target)
    e.target.classList.remove('dragging')
  },

  this.setDragOver = function (e) {
    e.preventDefault();
    const afterElement = getDragAfterElement(this.sourceCardsContainer, e.clientX, e.clientY);
    const draggable = document.querySelector('.dragging');
    if (afterElement == null) {
      e.currentTarget.appendChild(draggable);
    } else {
      this.sourceCardsContainer.insertBefore(draggable, afterElement);
    }    
  },

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
        return `<div class="boardItem" draggable="true">${handleTemplate}
          ${linesHtml}
        </div>`;
      }
    );
    items.forEach((itemHtml, i) => {
      container.insertAdjacentHTML('beforeend', itemHtml);
    });
    this.sourceItems = Array.from(container.querySelectorAll('.boardItem'));
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
    if (!this.renderedEventSet) {
      this.setRenderedEvents([
        this.sourceCardsContainer,
        this.goodCol,
        this.failedCol
      ]);
      this.renderedEventSet = true;
    }
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
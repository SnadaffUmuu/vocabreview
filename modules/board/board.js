import { DataFactory } from "../data.js";
import { View } from "../view.js";
import {
  speak,
  UserActionHandlers,
  getDragAfterElement,
  createPlaceholder,
  shuffleArray,
} from "../utils.js";
import { Application } from "../app.js";

export const BoardView = function () {
  this.actionsContainer = null;

  this.events = {
    'change #studyMode': 'toggleStudyMode',
    'click #resetBoard': 'resetBoard',
    'change #cardMode': 'setMode',
  };

  this.namespaces = {
    'UserActionHandlers': UserActionHandlers
  },

    this.renderedEvents = {
      click: {
        '.itemLine': 'rotateCard'
      },
      contextmenu: {
        '#boardSourceCards': 'UserActionHandlers.preventDefault',
        '#boardGoodCol': 'UserActionHandlers.preventDefault',
        '#boardFailedCol': 'UserActionHandlers.preventDefault',
      },
      dragstart: {
        '.boardItem': 'itemDragStart'
      },
      dragend: {
        '.boardItem': 'itemDragEnd'
      },
      dragover: {
        '#boardSourceCards': 'setDragOver true',
        '#boardGoodCol': 'setDragOver true',
        '#boardFailedCol': 'setDragOver true',
      },
      touchstart: {
        '.boardItem': 'setTouchStart true',
      },
      touchmove: {
        '.boardItem': 'setTouchMove true',
      },
      touchend: {
        '.boardItem': 'setTouchEnd true',
      },
    };

  this.getDragItem = function (target) {
    return target.classList.contains('boardItem') ? target : target.closest('.boardItem');
  };

  this.toggleStudyMode = function (e) {
    [this.goodCol, this.failedCol, this.sourceCardsContainer].forEach(el =>
      el.classList.toggle(this.studyModeClass));
  };

  this.resetBoard = function (e) {
    this.render(true);
  };

  this.rotateCard = function (e) {
    if (!e.currentTarget.classList.contains(this.studyModeClass)) return;
    e.stopPropagation();
    e.preventDefault();
    if (!e.target.classList.contains('itemLine')) return;

    const el = e.target;
    const item = el.classList.contains('.boardItem') ? el : el.closest('.boardItem');

    if (item.querySelectorAll('.itemLine').length == 1) {
      console.log('non-rotatiable, only 1 line');
      return;
    }
    const current = item.querySelector('[data-current]');
    let newCurrent = null;
    if (current && current.nextElementSibling) {
      newCurrent = current.nextElementSibling
    } else {
      newCurrent = item.querySelector('.itemLine')
    }
    newCurrent.dataset.current = true;
    if (current && current.dataset) {
      delete current.dataset.current;
    }
    this.setCurrentLineIndex(item.dataset.originalIndex, newCurrent.dataset.originalIndex);
  };

  this.setCurrentLineIndex = function (itemIndex, lineIndex) {
    if (this.state.lineIndexes[itemIndex]) {
      this.state.lineIndexes[lineIndex] = lineIndex;
      this.state.lineIndexes = this.state.lineIndexes;
    } else {
      this.state.lineIndexes = Object.assign({ [itemIndex]: lineIndex }, this.state.lineIndexes)
    }
  }

  this.setMode = function (e) {
    Application.views.PreloaderView.showPreloaderAndRun(() => {
      this.state.mode = e.target.value;
      this.state.lineIndexes && delete this.state.lineIndexes;
      this.state.itemsInCols = {};
      this.render();
    });
  };

  this.setItemInCol = function (e) {
    if (e.currentTarget.dataset?.result) {
      this.state.itemsInCols[e.target.dataset.originalIndex] = e.currentTarget.dataset.result;
      e.target.dataset.resultCol = e.currentTarget.dataset.result;
    } else {
      delete this.state.itemsInCols[e.target.dataset.originalIndex];
      e.target.dataset?.resultCol && delete e.target.dataset?.resultCol;
    }
    this.state.itemsInCols = this.state.itemsInCols;
  };

  this.setTouchStart = function (e) {
    if (e.currentTarget.classList.contains(this.studyModeClass)) return;
    const item = this.getDragItem(e.target);
    this.touchTimeout = setTimeout(() => {
      this.draggable = true;
      item.classList.add("dragging");
    }, this.longtouchTimeout);
  },

    this.setTouchMove = function (e) {
      if (e.currentTarget.classList.contains(this.studyModeClass)) return;
      if (this.draggable !== true) {
        e.stopPropagation();
        clearTimeout(this.touchTimeout)
      } else {
        this.draggedItem = this.getDragItem(e.target);
        if (!this.placeholder) {
          this.placeholder = createPlaceholder(this.draggedItem.querySelector('[data-current]'));
        }
        const touch = e.touches[0];
        this.draggedItem.style.position = 'absolute';
        this.draggedItem.style.left = `${touch.clientX - 20}px`;
        this.draggedItem.style.top = `${touch.clientY - 20}px`;
        const elFromPoint = document.elementFromPoint(touch.clientX, touch.clientY);
        this.potentialContainer = elFromPoint.closest('.itemDroppableContainer');
        if (this.potentialContainer && this.placeholder) {
          const outer = this.potentialContainer.closest('#boardColsContainerOuter');
          if (outer) {
            if (!this.scrollInterval
              && (touch.clientX > document.documentElement.clientWidth - 100
                || touch.clientX < 100)) {
              this.scrollInterval = setInterval(() => {
                if (touch.clientX > (document.documentElement.clientWidth - 100)) {
                  outer.scroll(outer.scrollLeft + 20, outer.scrollTop);
                } else if (touch.clientX < 100) {
                  outer.scroll(outer.scrollLeft - 20, outer.scrollTop);
                }
              }, 100)
            }
          }
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
      if (e.currentTarget.classList.contains(this.studyModeClass)) return;
      this.touchTimeout && clearTimeout(this.touchTimeout);
      this.scrollInterval && clearInterval(this.scrollInterval);
      this.draggable = false;
      this.draggedItem && this.draggedItem.classList.remove("dragging");
      if (this.draggedItem && this.placeholder && this.placeholder.parentNode) {
        this.placeholder.parentNode.insertBefore(this.draggedItem, this.placeholder);
        this.setItemInCol(e);

        this.placeholder.remove();
        this.draggedItem.style.left = "";
        this.draggedItem.style.top = "";
        this.draggedItem.style.position = '';
      }
      this.draggedItem = null;
      this.placeholder = null;
      this.scrollInterval = null;
    },

    this.itemDragStart = function (e) {
      if (e.currentTarget.classList.contains(this.studyModeClass)) return;
      e.target.classList.add('dragging')
    },

    this.itemDragEnd = function (e) {
      if (e.currentTarget.classList.contains(this.studyModeClass)) return;
      e.target.classList.remove('dragging');
      this.setItemInCol(e);
    },

    this.setDragOver = function (e) {
      if (e.currentTarget.classList.contains(this.studyModeClass)) return;
      e.preventDefault();
      const afterElement = getDragAfterElement(this.sourceCardsContainer, e.clientX, e.clientY);
      const draggable = document.querySelector('.dragging');
      if (afterElement == null) {
        e.currentTarget.appendChild(draggable);
      } else {
        this.sourceCardsContainer.insertBefore(draggable, afterElement);
      }
    },

    this.renderLine = function (l, i, currentLineIndex) {
      const dataset = {
        'original-index': l.originalIndex
      };
      const attrs = {};
      if (l.speakable) {
        attrs.speakable = 'true';
      }
      if (l.role) {
        attrs.role = l.role;
      }
      if (l.reading) {
        attrs.reading = l.reading;
      }
      if (l.isCompact) {
        attrs.compact = true;
      }
      if (currentLineIndex != null && i == currentLineIndex) {
        dataset.current = true;
      }
      let attrsParsed = '';
      for (let attr in attrs) {
        attrsParsed += ` ${attr}="${attrs[attr]}"`;
      }
      let datasetParsed = '';
      for (let dataAttr in dataset) {
        datasetParsed += ` data-${dataAttr}="${dataset[dataAttr]}"`;
      }
      return `
      <div class="itemLine" ${attrsParsed} ${datasetParsed}>
        ${l.text}
      </div>
    `;
    };

  this.renderItem = function (entry, mode) {
    const lines = entry.lines;
    let currentLineIndex = this.state.lineIndexes && this.state.lineIndexes[entry.originalIndex] ?
      this.state.lineIndexes[entry.originalIndex] : null;
      let currentIndex = currentLineIndex;
      if (currentIndex == null) {
      const lRoles = DataFactory.LINE_ROLE;
      switch (mode) {
        case lRoles.expression:
          currentIndex = lines.find(line => line.role == lRoles.expression)?.originalIndex
          break;
        case lRoles.meaning:
          currentIndex = lines.find(line => line.role == lRoles.meaning)?.originalIndex
          break;
        case lRoles.example:
          const examples = lines.filter(line => line.role == lRoles.example);
          currentIndex = examples.length ? shuffleArray(examples)[0]?.originalIndex : null;
          //TODO: make examples go in a row
          break;
        case 'random':
          currentIndex = shuffleArray(lines)[0].originalIndex;
        case 'original':
        default:
          currentIndex = lines[0].originalIndex;
      }
    }
    return `
    <div class="boardItem" draggable="true"  data-original-index="${entry.originalIndex}">
        ${entry.lines.map((l, i) => this.renderLine(l, i, currentIndex)).join('')}
      </div>
    `;
  };

  this.renderBoard = function () {
    const entries = this.data.entries;
    const mode = this.state.mode ? this.state.mode : 'original';
    entries.forEach(entry => {
      const html = this.renderItem(entry, mode);
      const stContainer = this.state.itemsInCols[entry.originalIndex] ? this.state.itemsInCols[entry.originalIndex] : null;
      const container = stContainer ? this.cols[stContainer] : this.sourceCardsContainer;
      container.insertAdjacentHTML('beforeend', html);
    });
    this.sourceItems = [...this.sourceCardsContainer.querySelectorAll('.boardItem')];
    this.correctItems = [...this.goodCol.querySelectorAll('.boardItem')];
    this.incorrectItems = [...this.failedCol.querySelectorAll('.boardItem')];
  };

  this.handleStateChange = function (newState, prop, value) {
    if (prop == 'mode') {
      delete this.state.lineIndexes;
    }
  };

  this.reset = function (resetAll) {
    this.data = {};
    this.sourceCardsContainer.innerHTML = '';
    this.goodCol.innerHTML = '';
    this.failedCol.innerHTML = '';
    if (resetAll) {
      this.state.itemsInCols = {};
      this.state.lineIndexes && delete this.state.lineIndexes;
      this.studyModeEl.checked = false;
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
    this.data.entries = structuredClone(Application.data.currentEntries);

    if (this.state.mode) {
      Array.from(this.cardModeEl.querySelectorAll('option')).forEach(op => {
        op.selected = op.value == this.state.mode;
      })
    }
    if (!this.state.lineIndexes) {
      this.state.lineIndexes = [];
    }
    if (!this.state.itemsInCols) {
      this.state.itemsInCols = {};
    }

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
    this.cols = {
      '1' : this.goodCol,
      '0' : this.failedCol
    }
    this.studyModeEl = this.element.querySelector('#studyMode');
    this.cardModeEl = this.element.querySelector('#cardMode');
    this.render();
  }
}

BoardView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templatePath: 'modules/board/board.html',
  templateSelector: '#boardView',
  longtouchTimeout: 0,
  studyModeClass: 'studyMode',
});

BoardView.prototype.constructor = BoardView;
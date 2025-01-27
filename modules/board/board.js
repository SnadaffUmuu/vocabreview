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
    'click #resetBoard': 'resetBoard',
    'change #cardMode': 'setMode',
    'change #studyMode': 'toggleStudyMode',
    'click .itemDroppableContainer': 'collapseAllItems',
    'click #reviewFailed': 'setReviewFailed',
  };

  this.namespaces = {
    'UserActionHandlers': UserActionHandlers
  },

  this.renderedEvents = {
    click: {
      '.boardItem:not(.menuExpanded)': 'toggleItemMenu',
      '.boardItem.menuExpanded .itemLine': 'rotateCard',
      '.boardItem .reading': 'speakLine',
      '.itemActions .speakLine': 'speakLine',
      '.expandLine': 'toggleExpandLine',
      '.removeItem': 'removeItem',
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

  this.isStudyMode = function (e) {
    return this.studyModeEl.checked ? true : false;
  }

  this.toggleStudyMode = function () {
    [...this.element.querySelectorAll('.menuExpanded')].forEach(item => {
      item.classList.remove('menuExpanded');
      item.style.top = 'unset';
      item.parentNode.querySelector('.expandPlaceholder')?.remove();
    });
  };

  this.collapseAllItems = function (e) {
    if (!e.target.classList.contains('itemDroppableContainer')) return;
    this.toggleStudyMode();
  },

  this.toggleExpandLine = function (e) {
    if (!this.isStudyMode()) return;
    this.getDragItem(e.target).classList.toggle('lineExpanded');
  };

  this.removeItem = function (e) {
    if (!this.isStudyMode()) return;
    const item = this.getDragItem(e.target);
    this.state.removedItems.push(parseInt(item.dataset.originalIndex));
    this.state.removedItems = this.state.removedItems;
    delete this.state.itemsInCols[item.dataset.originalIndex];
    this.state.itemsInCols = this.state.itemsInCols;
    item.remove();
    this.element.querySelector('.expandPlaceholder')?.remove();
  };

  this.toggleItemMenu = function (e) {
    if (!this.isStudyMode()) return;
    const item = this.getDragItem(e.target);
    const container = item.closest('.itemDroppableContainer');
    if (!item || !container) return;
    if (!item.classList.contains('menuExpanded')) {
      const top = item.getBoundingClientRect().top;
      const width = item.offsetWidth;
      const height = item.offsetHeight;
      item.classList.add('menuExpanded');
      item.style.top = top + 'px';
      const expandPlaceholder = document.createElement('div');
      expandPlaceholder.classList.add('expandPlaceholder');
      expandPlaceholder.classList.add('boardItem');
      expandPlaceholder.style.cssText = `
        width:${width}px;
        height:${height}px;
      `;
      container.insertBefore(expandPlaceholder, item);
    } else {
      item.classList.remove('menuExpanded');
      item.style.top = 'unset';
      expandPlaceholder.remove();
    }
  };

  this.speakLine = function (e) {
    e.stopPropagation();
    const expandedItem = e.target.closest('.boardItem');
    if (!expandedItem) return;
    const line = expandedItem.querySelector('[data-current]');
    if (!line || !line.dataset?.reading) return;
    console.log('speaking');
    speak(line.dataset.reading);
  }

  this.getDragItem = function (target) {
    return target.classList.contains('boardItem') ? target : target.closest('.boardItem');
  };

  this.resetBoard = function (e) {
    this.render(true);
  };

  this.rotateCard = function (e) {
    if (!this.isStudyMode()) return;
    e.stopPropagation();
    e.preventDefault();
    const item = this.getDragItem(e.target);
    if (!item) return;
    const allLines = item.querySelectorAll('.itemLine');
    if (allLines.length == 1) {
      console.log('non-rotatiable, only 1 line');
      return;
    }
    let current = null;
    let next = null;
    let c = 0;
    for (let l of allLines) {
      if (l.dataset.current) {
        current = l;
        next = allLines[c + 1] ? allLines[c + 1] : allLines[0];
        break;
      }
      c++;
    }
    next.dataset.current = true;
    if (current && current.dataset) {
      delete current.dataset.current;
    }
    this.setCurrentLineIndex(parseInt(item.dataset.originalIndex), parseInt(next.dataset.originalIndex));
  };

  this.setCurrentLineIndex = function (itemIndex, lineIndex) {
    if (this.state.lineIndexes[itemIndex]) {
      this.state.lineIndexes[itemIndex] = lineIndex;
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
    const item = this.getDragItem(e.target);
    if (!item) return;
    const container = item.closest('.itemDroppableContainer');
    if (container?.dataset?.result) {
      this.state.itemsInCols[item.dataset.originalIndex] = container.dataset.result;
    } else {
      delete this.state.itemsInCols[item.dataset.originalIndex];
    }
    this.state.itemsInCols = this.state.itemsInCols;
  };

  this.setReviewFailed = function (e) {
    const badItems = this.failedCol.querySelectorAll('.boardItem');
    if (!badItems.length) return;
    this.goodCol.querySelectorAll('.boardItem').forEach(item => {
      this.state.removedItems.push(parseInt(item.dataset.originalIndex));
      delete this.state.itemsInCols[item.dataset.originalIndex];
      //item.remove();
    });
    badItems.forEach(item => {
      //this.sourceCardsContainer.appendChild(this.failedCol.removeChild(item));
      delete this.state.itemsInCols[item.dataset.originalIndex];
    });
    this.state.removedItems = this.state.removedItems;
    this.state.itemsInCols = this.state.itemsInCols;
    this.render();
  };

  this.setTouchStart = function (e) {
    if (this.isStudyMode()) return;
    const item = this.getDragItem(e.target);
    if (!item) return;
    this.touchTimeout = setTimeout(() => {
      this.draggable = true;
      item.classList.add("dragging");
    }, this.longtouchTimeout);
  },

  this.setTouchMove = function (e) {
    if (this.isStudyMode()) return;
    if (this.draggable !== true) {
      e.stopPropagation();
      clearTimeout(this.touchTimeout)
    } else {
      const draggedItem = this.getDragItem(e.target);
      if (!draggedItem) return;
      this.draggedItem = draggedItem;
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
        /*
        const outer = this.potentialContainer.closest('#boardColsContainerOuter');
        if (outer) {
          if (this.draggedItem
            && !this.scrollInterval
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
        */
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
    if (this.isStudyMode()) return;
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
    if (this.isStudyMode()) return;
    e.target.classList.add('dragging')
  },

  this.itemDragEnd = function (e) {
    if (this.isStudyMode()) return;
    e.target.classList.remove('dragging');
    this.setItemInCol(e);
  },

  this.setDragOver = function (e) {
    if (this.isStudyMode()) return;
    e.preventDefault();
    const afterElement = getDragAfterElement(this.sourceCardsContainer, e.clientX, e.clientY);
    const draggable = document.querySelector('.dragging');
    if (afterElement == null) {
      e.currentTarget.appendChild(draggable);
    } else {
      this.sourceCardsContainer.insertBefore(draggable, afterElement);
    }
  },

  this.renderLine = function (l, currentLineIndex) {
    if (l.role && l.role == DataFactory.LINE_ROLE.reading) {
      return;
    }

    const dataset = {
      'original-index': l.originalIndex
    };
    if (currentLineIndex != null && l.originalIndex == currentLineIndex) {
      dataset.current = true;
    }
    if (l.reading) {
      dataset.reading = l.reading;
    } else if (l.speakable) {
      dataset.reading = l.text;
    }

    const attrs = {};

    if (l.speakable) {
      attrs.speakable = 'true';
    }
    if (l.role) {
      attrs.role = l.role;
    }
    if (l.isCompact) {
      attrs.compact = true;
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
    const lRoles = DataFactory.LINE_ROLE;
    const currentLineIndex = this.state.lineIndexes && this.state.lineIndexes[entry.originalIndex] ?
      this.state.lineIndexes[entry.originalIndex] : null;
    let currentIndex = currentLineIndex;
    const reading = lines.find(line => line.role == lRoles.reading);
    const others = lines.filter(line => line.role !== lRoles.reading);
    if (currentIndex == null) {
      switch (mode) {
        case lRoles.expression:
          currentIndex = others.find(line => line.role == lRoles.expression)?.originalIndex
          break;
        case lRoles.meaning:
          currentIndex = others.find(line => line.role == lRoles.meaning)?.originalIndex
          break;
        case lRoles.example:
          const examples = others.filter(line => line.role == lRoles.example);
          currentIndex = examples.length ? shuffleArray(examples)[0]?.originalIndex : null;
          break;
        case 'random':
          currentIndex = shuffleArray(others)[0].originalIndex;
        case 'original':
        default:
          currentIndex = others[0].originalIndex;
      }
    }
    const entryActions = `
    <div class="itemActions">
      <div class="itemAction removeItem">✖</div>
      <div class="lineCounter">${entry.lines.length}</div>
      <div class="itemAction expandLine">⇕</div>
      <div class="itemAction speakLine">▶</div>
      <div class="itemAction reading">${reading ? reading.text : ''}</div>
    </div>
  `;
    return `
      <div class="boardItem" draggable="true"  data-original-index="${entry.originalIndex}">
        ${others.map((l, i) => this.renderLine(l, parseInt(currentIndex))).join('')}
        ${entryActions}
      </div>
    `;
  };

  this.renderBoard = function () {
    const entries = this.data.entries;
    const mode = this.state.mode || 'original';
    const removedItems = this.state.removedItems || [];
    entries.filter(en => !removedItems.includes(en.originalIndex)).forEach(entry => {
      const html = this.renderItem(entry, mode);
      const stContainer = this.state.itemsInCols[entry.originalIndex] ? this.state.itemsInCols[entry.originalIndex] : null;
      const container = stContainer ? this.cols[stContainer] : this.sourceCardsContainer;
      container.insertAdjacentHTML('beforeend', html);
    });
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
      this.state.removedItems = [];
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
    if (!this.state.removedItems) {
      this.state.removedItems = [];
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
      '1': this.goodCol,
      '0': this.failedCol
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
});

BoardView.prototype.constructor = BoardView;

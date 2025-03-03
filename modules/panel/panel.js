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

export const PanelView = function () {

  this.namespaces = {
    'UserActionHandlers': UserActionHandlers
  }

  this.events = {
    'click #resetPanel': 'resetPanel',
    'change #cardMode': 'setMode',
    'click .itemDroppableContainer': 'collapseAllItems',
    'change #panelActions': 'executeFunction',
    'change #markGlobal': 'toggleMarkGlobal',
    'click #render' : 'render',
  }

  this.renderedEvents = {
    click: {
      '.tapZone': 'toggleItemMenu',
      '.panelItem.menuExpanded .itemLine': 'rotateCard',
      '.panelItem .reading': 'speakReading',
      '.itemActions .speakLine': 'speakLine',
      '.expandLine': 'toggleExpandLine',
      '.removeItem': 'removeItem',
      '.toggleInfo': 'toggleInfo',
    },
    contextmenu: {
      '#panelSources': 'UserActionHandlers.preventDefault',
      '#box1': 'UserActionHandlers.preventDefault',
      '#box2': 'UserActionHandlers.preventDefault',
      '#box3': 'UserActionHandlers.preventDefault',
      '#box4': 'UserActionHandlers.preventDefault',
    },
    dragstart: {
      '.panelItem': 'itemDragStart'
    },
    dragend: {
      '.panelItem': 'itemDragEnd'
    },
    dragover: {
      '.itemDroppableContainer': 'setDragOver true',
    },
    touchstart: {
      '.panelItem': 'setTouchStart true',
    },
    touchmove: {
      '.panelItem': 'setTouchMove true',
    },
    touchend: {
      '.panelItem': 'setTouchEnd true',
    },
  }

  this.setPanelLayout = function () {
    const el = this.element.querySelector('#boxesContainerOuter');
    const top = el.getBoundingClientRect().top;
    el.style.minHeight = 'calc(100dvh - ' + top + 'px)';
  }  

  this.filterStateObjByCurrentEntries = function (stateObj) {
    return Object.fromEntries(
      Object.entries(stateObj).filter(([key, value]) =>
        !this.data.entries.find(entry => entry.originalIndex == key))
    );
  }

  this.executeFunction = function (e) {
    if (e.target.value == '') return;
    this[e.target.value]();
  }

  this.setGlobal = function () {
    const candidates = [...this.box4.querySelectorAll('.panelItem')];
    const entriesToAdd = candidates.map(el =>
      this.data.entries.find(entry =>
        entry.originalIndex == el.dataset.originalIndex))

    Application.setGlobal(structuredClone(entriesToAdd));

    candidates.forEach(el => {
      delete this.state.itemsInBoxes[el.dataset.originalIndex];
    });
    this.state.selfUpdate = !this.state.selfUpdate;
    this.render();
  }

  this.toggleMarkGlobal = function (e) {
    const items = this.element.querySelectorAll('.panelItem');
    if (e.target.checked) {
      const globalHashes = Application.data[DataFactory.globalPool]?.allEntries.map(en => en.hash) ?? [];
      [...items].forEach(el => {
        const entry = this.data.entries.find(en => en.originalIndex == parseInt(el.dataset.originalIndex));
        if (entry) {
          entry.source ??= Application.state.currentSource;
          entry.hash ??= stringToHash(JSON.stringify(entry));
          if (globalHashes.includes(entry.hash)) {
            el.dataset.global = true;
          } else {
            delete el.dataset.global
          }
        }
      })
    } else {
      [...items].forEach(el => {
        delete el.dataset.global
      })
    }
  }

  this.collapseAllItems = function (e) {
    if (!e.target.classList.contains('itemDroppableContainer')) return;
    [...this.element.querySelectorAll('.menuExpanded')].forEach(item => {
      item.classList.remove('lineExpanded');
      item.classList.remove('menuExpanded');
      item.classList.remove('infoShown');
      //item.style.top = 'unset';
    });
  }

  this.toggleExpandLine = function (e) {
    this.getDragItem(e.target).classList.toggle('lineExpanded');
  }

  this.toggleInfo = function (e) {
    this.getDragItem(e.target).classList.toggle('infoShown');
  }

  this.toggleItemMenu = function (e) {
    const item = this.getDragItem(e.target);
    const container = item.closest('.itemDroppableContainer');
    if (!item || !container) return;
    if (!item.classList.contains('menuExpanded')) {
      /*
      const top = item.getBoundingClientRect().top;
      const width = item.offsetWidth;
      const height = item.offsetHeight;
      item.style.top = top + 'px';
      */
      item.classList.add('menuExpanded');
      item.classList.add('lineExpanded');
    } else {
      item.classList.remove('lineExpanded')
      item.classList.remove('menuExpanded');
      //item.style.top = 'unset';
    }
  };

  this.speakLine = function (e) {
    e.stopPropagation();
    const expandedItem = e.target.closest('.panelItem');
    if (!expandedItem) return;
    const line = expandedItem.querySelector('[data-current]');
    if (!line || !line.dataset?.reading) return;
    console.log('speaking');
    speak(line.dataset.reading);
  }

  this.speakReading = function (e) {
    e.stopPropagation();
    speak(e.target.innerText)
  }

  this.resetPanel = function (e) {
    this.render(true);
  };

  this.rotateCard = function (e) {
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
    if (this.state.lineIndexes[itemIndex] !== undefined) {
      this.state.lineIndexes[itemIndex] = lineIndex;
    } else {
      this.state.lineIndexes = Object.assign({ [itemIndex]: lineIndex }, this.state.lineIndexes)
    }
    this.state.selfUpdate = !this.state.selfUpdate;
  };

  this.setMode = function (e) {
    Application.views.PreloaderView.showPreloaderAndRun(() => {
      this.state.mode = e.target.value;
      delete this.state.lineIndexes;
      this.render();
    });
  };

  this.getDragItem = function (target) {
    return target.classList.contains('panelItem') ? target : target.closest('.panelItem');
  };

  this.removeItem = function (e) {
    const item = this.getDragItem(e.target);
    if (Application.state.currentSource == DataFactory.globalPool) {
      Application.getCurrentSourceData().allEntries = Application.getCurrentSourceData().allEntries.filter(entry =>
        entry.hash !== parseInt(item.dataset.hash));
    } else {
      this.state.removedItems.push(parseInt(item.dataset.originalIndex));
      this.state.removedItems = this.state.removedItems;
      delete this.state.itemsInBoxes[item.dataset.originalIndex];
      this.state.itemsInBoxes = this.state.itemsInBoxes;
      item.remove();
    }
  }

  this.setItemInBox = function (e, elementFromPoint) {
    if (elementFromPoint) {
      if (Application.views.MenuView.element.contains(elementFromPoint)) {
        this.removeItem(e);
      } else {
        const item = this.getDragItem(e.target);
        if (!item) return;
        const container = item.closest('.itemDroppableContainer');
        if (container?.dataset?.box) {
          this.state.itemsInBoxes[item.dataset.originalIndex] = container.dataset.box;
        } else {
          delete this.state.itemsInBoxes[item.dataset.originalIndex];
        }
        this.state.selfUpdate = !this.state.selfUpdate
      }
    }
  };

  /* Touch Drag */

  this.setTouchStart = function (e) {
    const item = this.getDragItem(e.target);
    if (!item) return;
    this.touchTimeout = setTimeout(() => {
      this.draggable = true;
      item.classList.add("dragging");
      this.elevate(item);
      const elementRect = item.getBoundingClientRect();
      const touch = e.touches[0];
      item.dataset.offsetX = touch.clientX - elementRect.left;
      item.dataset.offsetY = touch.clientY - elementRect.top;
    }, this.longtouchTimeout);
  }

  this.setTouchMove = function (e) {
    if (this.draggable !== true) {
      e.stopPropagation();
      clearTimeout(this.touchTimeout)
    } else {
      const draggedItem = this.getDragItem(e.target);
      if (!draggedItem) return;
      this.draggedItem = draggedItem;
      const touch = e.touches[0];
      this.lastMove = touch;
      this.draggedItem.style.position = 'fixed';
      this.draggedItem.style.left = `${touch.clientX}px`;
      this.draggedItem.style.top = `${touch.clientY}px`;
      e.preventDefault();
    }
  }

  this.setTouchEnd = function (e) {
    this.touchTimeout && clearTimeout(this.touchTimeout);
    this.scrollInterval && clearInterval(this.scrollInterval);
    this.draggable = false;
    if (this.draggedItem) {
      this.draggedItem.classList.remove("dragging");
      let targetContainer = document.elementFromPoint(this.lastMove.clientX, this.lastMove.clientY);
      if (!targetContainer.classList.contains('itemDroppableContainer')) {
        targetContainer = targetContainer.closest('.itemDroppableContainer');
      }
      targetContainer.appendChild(this.draggedItem);
      this.draggedItem.style.position = 'absolute';
      const containerOffsetTop = parseInt(targetContainer.dataset.top);
      const containerOffsetLeft = parseInt(targetContainer.dataset.left);
      const itemTop = this.lastMove.clientY - parseInt(this.draggedItem.dataset.offsetY) - containerOffsetTop;
      const itemLeft = this.lastMove.clientX - parseInt(this.draggedItem.dataset.offsetX) - containerOffsetLeft;
      this.draggedItem.style.top = Math.max(itemTop, 0) + 'px';
      this.draggedItem.style.left = Math.max(itemLeft, 0) + 'px';
      this.setItemInBox(e, targetContainer);
    }
    this.draggedItem = null;
    this.scrollInterval = null;
  }

  this.itemDragStart = function (e) {
    e.target.classList.add('dragging');
    this.elevate(e.target);
  }

  this.setDragOver = function (e) {
    e.preventDefault();
  }

  this.itemDragEnd = function (e) {
    let targetContainer = document.elementFromPoint(e.clientX, e.clientY);
    if (!targetContainer.classList.contains('itemDroppableContainer')) {
      targetContainer = targetContainer.closest('.itemDroppableContainer');
    }
    targetContainer.appendChild(e.target);
    e.target.style.left = (e.clientX - parseInt(targetContainer.dataset.left) - parseInt(e.target.dataset.offsetX)) + 'px';
    e.target.style.top = (e.clientY - parseInt(targetContainer.dataset.top) - parseInt(e.target.dataset.offsetY)) + 'px';
    
    e.target.classList.remove('dragging');
    this.setItemInBox(e, targetContainer);
  }

  /* eof Touch Drag */

  this.renderLine = function (l, currentLineIndex, entry) {
    const dataset = {
      'original-index': l.originalIndex
    };
    if (currentLineIndex != null && l.originalIndex == currentLineIndex) {
      dataset.current = true;
    }
    if (l.speakable) {
      dataset.reading = l.text;
    }
    if (entry.reviewLevel && l.originalIndex == 0) {
      dataset['review-level'] = entry.reviewLevel
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
    let lines = entry.lines;
    const lRoles = DataFactory.LINE_ROLE;
    const reading = lines.find(line => line.role == lRoles.reading);
    if (reading) {
      lines = entry.lines.filter(l => l.role != DataFactory.LINE_ROLE.reading);
    }
    let currentIndex = this.state.lineIndexes[entry.originalIndex] ?? null;
    let reorderedLines = null;
    if (currentIndex == null) {
      let theOrder = null;
      const transArr = [];
      switch (mode) {
        case 'expression':
        case 'meaning':
        case 'example':
          theOrder = DataFactory.lineOrders[mode];
          reorderedLines = theOrder.flatMap(role => {
            const subArr = lines.filter(line => line.role == role);
            if (!subArr.length) return [null];

            if (['example', 'example_translation'].includes(role)) {
              return shuffleArray(subArr)
            } else {
              return subArr
            }
          }).filter(o => o != null);
          break;
        case 'example_translation':
          theOrder = DataFactory.lineOrders[mode];
          reorderedLines = theOrder.flatMap(role => {
            const subArr = lines.filter(line => line.role == role);
            if (!subArr.length) return [null];

            if ('example_translation' == role) {
              shuffleArray(subArr).forEach(line => {
                transArr.push(line);
                const orig = lines.find(ll => ll.translationLineIndex
                  == line.originalIndex);
                if (orig) {
                  transArr.push(orig);
                }
              });
              return transArr;
            } else if ('example' == role) {
              const untranslatedExamples = subArr.filter(line => !transArr.includes(line));
              return shuffleArray(untranslatedExamples);
            } else {
              return subArr;
            }
          }).filter(o => o != null);
          break;
        case 'random':
          reorderedLines = shuffleArray(sides);
        case 'original':
        default:
          reorderedLines = lines;
      }
    }
    if (currentIndex == null) {
      currentIndex = reorderedLines[0].originalIndex;
    }
    const finalLines = reorderedLines || lines;
    const entryActions = `
    <div class="itemActions">
      <div class="itemAction removeItem">✖</div>
      <div class="itemAction expandLine">⇕</div>
      <div class="itemAction speakLine">▶</div>
      ${entry.info ? '<div class="itemAction toggleInfo">ⓘ</div>' : ''}
      <div class="itemAction reading">${reading ? reading.text : ''}</div>
    </div>
  `;
    return `
      <div class="panelItem" 
        draggable="true"
        ${entry.tag ? ' data-tag="' + entry.tag + '"' : ''} 
        ${entry.hash ? ' data-hash="' + entry.hash + '"' : ''} 
        data-upper-line-index="${currentIndex}" 
        data-original-index="${entry.originalIndex}">
        ${entry.info ? ' <div class="itemInfo">ⓘ&nbsp;' + entry.info + '</div><div class="infoMark">i</div>' : ''}
        <div class="lineCounter">${finalLines.length}</div>
        <div class="tapZone"></div>
        ${finalLines.map((l, i) => this.renderLine(l, parseInt(currentIndex), entry)).join('')}
        ${entryActions}
      </div>
    `;
  };

  this.renderPanel = function () {
    const entries = this.data.entries;
    const mode = this.state.mode || 'original';
    const removedItems = this.state.removedItems || [];
    entries.filter(en => !removedItems.includes(en.originalIndex)).forEach(entry => {
      const html = this.renderItem(entry, mode);
      const stContainer = this.state.itemsInBoxes[entry.originalIndex] ? this.state.itemsInBoxes[entry.originalIndex] : null;
      const container = stContainer ? this.boxes[stContainer] : this.panelSources;
      container.insertAdjacentHTML('beforeend', html);
    });
    this.tagsLegend.innerHTML = DataFactory.buildLegendHtml();
    this.unFastenItems();
  };

  this.unFastenItems = function () {
    [...this.element.querySelectorAll('.itemDroppableContainer')].forEach(box => {
      if (box.id == 'panelSources') {
        box.style.width = box.offsetWidth + 'px';
        box.style.height = box.offsetHeight + 'px';
      }
      const rectBox = box.getBoundingClientRect();
      box.dataset.left = rectBox.left;
      box.dataset.top = rectBox.top;
      const items = box.querySelectorAll('.panelItem');
      [...items].forEach(item => {
        item.style.left = item.offsetLeft + 'px';
        item.style.top = item.offsetTop + 'px';
      });
      box.classList.remove('fastened');
      box.classList.add('unfastened');
    })
  };

  this.resetBoxesDimensions = function () {
    [...this.element.querySelectorAll('.itemDroppableContainer')].forEach(box => {
      delete box.dataset.left;
      delete box.dataset.top;
      box.classList.remove('unfastened');
      box.classList.add('fastened');
    })
  };

  this.resetItems = function () {
    [...this.element.querySelectorAll('.panelItem')].forEach(item => {
      item.removeAttribute('style');
      delete item.dataset.offsetX;
      delete item.dataset.offsetY;
    })
  }

  this.elevate = function (theItem) {
    [...theItem.closest('.itemDroppableContainer').querySelectorAll('.panelItem')].forEach(item => {
      item.style.zIndex = item == theItem ? '100' : '0';
    })
  };

  this.handleStateChange = function (newState, prop, value) {
    if (prop == 'mode') {
      this.state.lineIndexes = [];
    }
  };

  this.reset = function (resetAll) {
    this.panelSources.innerHTML = '';
    this.box1.innerHTML = '';
    this.box2.innerHTML = '';
    this.box3.innerHTML = '';
    this.box4.innerHTML = '';
    this.resetBoxesDimensions();
    this.resetItems();
    this.element.querySelector('#markGlobal').removeAttribute('checked');
    setSelectOption(this.panelActions, '');
    if (resetAll == true) {
      this.state.removedItems = this.state.removedItems.filter(index =>
        !this.data.entries.find(entry => entry.originalIndex == index)
      );
      this.state.itemsInBoxes = this.filterStateObjByCurrentEntries(this.state.itemsInBoxes);
      this.state.lineIndexes = this.filterStateObjByCurrentEntries(this.state.lineIndexes);
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

    if (this.state.mode) {
      Array.from(this.cardModeEl.querySelectorAll('option')).forEach(op => {
        op.selected = op.value == this.state.mode;
      })
    }
    this.state.lineIndexes ??= {};
    this.state.itemsInBoxes ??= {};
    this.state.removedItems ??= [];
    this.renderPanel();
    this.setPanelLayout();

    if (!this.renderedEventSet) {
      this.setRenderedEvents([
        this.sourceContainer,
        this.box1,
        this.box2,
        this.box3,
        this.box4
      ]);
      this.renderedEventSet = true;
    }
    Application.views.PreloaderView.hidePreloader();
  }

  this.show = function () {
    View.prototype.show.call(this);
    this.panelSources = this.element.querySelector('#panelSources');
    this.sourceContainer = this.element.querySelector('#panelSourceContainer');
    this.box1 = this.element.querySelector('#box1');
    this.box2 = this.element.querySelector('#box2');
    this.box3 = this.element.querySelector('#box3');
    this.box4 = this.element.querySelector('#box4');
    this.boxes = {
      '1': this.box1,
      '2': this.box2,
      '3': this.box3,
      '4': this.box4,
    }
    this.cardModeEl = this.element.querySelector('#cardMode');
    this.panelActions = this.element.querySelector("#panelActions");
    this.tagsLegend = this.element.querySelector('#panelLegend');

    this.renderedEventSet = null;
    this.render();
  }
}

PanelView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templatePath: 'modules/panel/panel.html',
  templateSelector: '#PanelView',
  longtouchTimeout: 100,
});

PanelView.prototype.constructor = PanelView;
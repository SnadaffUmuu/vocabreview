import {DataFactory} from "../data.js";
import {View} from "../view.js";
import {
  speak,
  UserActionHandlers,
  shuffleArray,
  stringToHash,
} from "../utils.js";
import {Application} from "../app.js";
import {BurgerButton} from "../components/burger-button/burger-button.js"
import {DropdownAction} from "../components/dropdown-action.js"
import {Prompt} from "../components/prompt/prompt.js"

export const PanelView = function () {

  this.namespaces = {
    'UserActionHandlers': UserActionHandlers
  }

  this.events = {
    'change #cardMode': 'setMode',
    'click .itemDroppableContainer': 'collapseAllItems',
    'change #markGlobal': 'toggleMarkGlobal',
    'click #render': 'render',
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
      '.clear': 'clearBox',
      '.focus': 'toggleFocusBox',
      '.rotateBack': 'rotateBack',
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

  this.updateSourceItemsCount = function () {
    this.sourceItemCounter.innerHTML = this.sourceContainer.querySelectorAll('.panelItem').length;
  }

  this.clearBox = function (e) {
    new Prompt({
      text: 'Clear the box?',
      onConfirm: () => {
        const theBox = e.target.closest('.itemDroppableContainer');
        [...theBox.querySelectorAll('.panelItem')].forEach(item => {
          delete this.state.itemsInBoxes[parseInt(item.dataset.originalIndex)];
        });
        Application.views.StructureView.render();
        this.state.selfUpdate = !this.state.selfUpdate;
        this.render();
      }
    });
  }

  this.toggleFocusBox = function (e) {
    const theBox = e.target.closest('.itemDroppableContainer');
    const placeholder = this.element.querySelector('.boxPlaceholder');
    const parent = theBox.parentElement;
    if(placeholder) {
      placeholder.remove();
      theBox.classList.remove('focused');
      theBox.removeAttribute('style');
      this.render();
    } else {
      const rect = theBox.getBoundingClientRect();
      const boxPlaceholder = document.createElement('DIV');
      boxPlaceholder.classList.add('boxPlaceholder');
      parent.insertBefore(boxPlaceholder, theBox);
      theBox.classList.add('focused');
      theBox.style.height = (rect.height * 2) + 'px';
      switch(theBox.id.slice(-1)) {
        case '1':
        case '2':
          theBox.style.top = (rect.top - 5) + 'px';
          break;
        case '3':
        case '4':
          theBox.style.bottom = (window.innerHeight - rect.bottom) + 'px'
          break;
      }
    }
  }

  this.setGlobal = function () {
    const candidates = [...this.box4.querySelectorAll('.panelItem')];
    const entriesToAdd = candidates.map(el =>
      this.data.entries.find(entry =>
        entry.originalIndex == el.dataset.originalIndex))

    Application.setGlobal(structuredClone(entriesToAdd));
  }

  this.toggleMarkGlobal = function (e) {
    const items = this.element.querySelectorAll('.panelItem');
    if(e.target.checked) {
      const globalHashes = Application.data[DataFactory.globalPool]?.allEntries?.map(en => en.hash) ?? [];
      [...items].forEach(el => {
        const entry = this.data.entries.find(en => en.originalIndex == parseInt(el.dataset.originalIndex));
        if(entry) {
          if(entry.source == null) entry.source = Application.state.currentSource;
          if(entry.hash == null) entry.hash = stringToHash(JSON.stringify(entry));
          if(globalHashes.includes(entry.hash)) {
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
    if(!e.target.classList.contains('itemDroppableContainer')) return;
    [...this.element.querySelectorAll('.menuExpanded')].forEach(item => {
      item.querySelectorAll('.itemLine').forEach(line => {
        if(!line.dataset.current
          && line.dataset.originalIndex == item.dataset.upperLineIndex) {
          line.dataset.current = true;
        } else if(line.dataset.current
          && line.dataset.originalIndex != item.dataset.upperLineIndex) {
          delete line.dataset.current
        }
      })
      item.classList.remove('lineExpanded');
      item.classList.remove('menuExpanded');
      item.classList.remove('infoShown');
      item.style.top = item.dataset.prevTop;
      delete item.dataset.prevTop;
      //this.state.lineIndexes = [];
      //this.state.selfUpdate = !this.state.selfUpdate;

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
    if(!item || !container) return;
    if(!item.classList.contains('menuExpanded')) {
      item.dataset.prevTop = item.style.top;
      const top = item.getBoundingClientRect().top;
      // const width = item.offsetWidth;
      // const height = item.offsetHeight;
      item.style.top = top + 'px';
      item.classList.add('menuExpanded');
      item.classList.add('lineExpanded');
    } else {
      item.classList.remove('lineExpanded')
      item.classList.remove('menuExpanded');
      item.style.top = item.dataset.prevTop;
      delete item.dataset.prevTop;
      //item.style.top = 'unset';
    }
  };

  this.speakLine = function (e) {
    e.stopPropagation();
    const expandedItem = e.target.closest('.panelItem');
    if(!expandedItem) return;
    const line = expandedItem.querySelector('[data-current]');
    if(!line || !line.dataset?.reading) return;
    console.log('speaking');
    speak(line.dataset.reading);
  }

  this.speakReading = function (e) {
    e.stopPropagation();
    speak(e.target.innerText)
  }

  this.resetPanel = function (e) {
    new Prompt({
      text: 'Reset panel?',
      onConfirm: () => {
        this.render(true);
      }
    })
  };

  this.rotateCard = function (e, toBack) {
    e.stopPropagation();
    e.preventDefault();
    const item = this.getDragItem(e.target);
    if(!item) return;
    const allLines = item.querySelectorAll('.itemLine');
    if(allLines.length == 1) {
      console.log('non-rotatiable, only 1 line');
      return;
    }
    let current = null;
    let next = null;
    let c = 0;
    for(let l of allLines) {
      if(l.dataset.current) {
        current = l;
        if (toBack) {
          next = allLines[c - 1] ? allLines[c - 1] : allLines[allLines.length - 1];
        } else {
          next = allLines[c + 1] ? allLines[c + 1] : allLines[0];
        }
        break;
      }
      c++;
    }
    next.dataset.current = true;
    if(current && current.dataset) {
      delete current.dataset.current;
    }
    //this.setCurrentLineIndex(parseInt(item.dataset.originalIndex), parseInt(next.dataset.originalIndex));
  };

  this.rotateBack = function (e) {
    this.rotateCard(e, true)
  }  

  /*
  this.setCurrentLineIndex = function (itemIndex, lineIndex) {
    if (this.state.lineIndexes[itemIndex] !== undefined) {
      this.state.lineIndexes[itemIndex] = lineIndex;
    } else {
      this.state.lineIndexes = Object.assign({ [itemIndex]: lineIndex }, this.state.lineIndexes)
    }
    this.state.selfUpdate = !this.state.selfUpdate;
  };
  */
  this.setMode = function (e) {
    Application.views.PreloaderView.showPreloaderAndRun(() => {
      this.state.mode = e.target.value;
      //this.state.lineIndexes = [];
      this.state.selfUpdate = !this.state.selfUpdate;
      this.render();
    });
  };

  this.getDragItem = function (target) {
    return target.classList.contains('panelItem') ? target : target.closest('.panelItem');
  };

  this.removeItem = function (e) {
    const item = this.getDragItem(e.target);
    if(Application.state.currentSource == DataFactory.globalPool) {
      Application.getCurrentSourceData().allEntries = Application.getCurrentSourceData().allEntries.filter(entry =>
        entry.hash !== parseInt(item.dataset.hash));
    } else {
      this.state.removedItems.push(parseInt(item.dataset.originalIndex));
      this.state.removedItems = this.state.removedItems;
      delete this.state.itemsInBoxes[item.dataset.originalIndex];
      this.state.itemsInBoxes = this.state.itemsInBoxes;
      item.remove();
      this.updateSourceItemsCount();
      Application.views.StructureView.render();
    }
  }

  this.setItemInBox = function (e, elementFromPoint) {
    if(elementFromPoint) {
      if(Application.views.MenuView.element.contains(elementFromPoint)) {
        this.removeItem(e);
      } else {
        const item = this.getDragItem(e.target);
        if(!item) return;
        const container = item.closest('.itemDroppableContainer');
        if(container?.dataset?.box) {
          this.state.itemsInBoxes[item.dataset.originalIndex] = container.dataset.box;
        } else {
          delete this.state.itemsInBoxes[item.dataset.originalIndex];
        }
        Application.views.StructureView.render();
        this.state.selfUpdate = !this.state.selfUpdate
      }
    }
  };

  /* Touch Drag */

  this.setTouchStart = function (e) {
    const item = this.getDragItem(e.target);
    if(!item || item.classList.contains('menuExpanded')) return;
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
    if(this.draggable !== true) {
      e.stopPropagation();
      clearTimeout(this.touchTimeout)
    } else {
      const draggedItem = this.getDragItem(e.target);
      if(!draggedItem || draggedItem.classList.contains('menuExpanded')) return;
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
    if(this.draggedItem) {
      this.draggedItem.classList.remove("dragging");
      let targetContainer = document.elementFromPoint(this.lastMove.clientX, this.lastMove.clientY);
      if(!targetContainer.classList.contains('itemDroppableContainer')) {
        targetContainer = targetContainer.closest('.itemDroppableContainer');
      }
      targetContainer.appendChild(this.draggedItem);
      //this.draggedItem.style.position = 'absolute';
      this.draggedItem.style.position = '';
      const containerOffsetTop = parseInt(targetContainer.dataset.top);
      const containerOffsetLeft = parseInt(targetContainer.dataset.left);
      const itemTop = this.lastMove.clientY - parseInt(this.draggedItem.dataset.offsetY) - containerOffsetTop;
      const itemLeft = this.lastMove.clientX - parseInt(this.draggedItem.dataset.offsetX) - containerOffsetLeft;
      this.draggedItem.style.top = Math.max(itemTop, 0) + 'px';
      this.draggedItem.style.left = Math.max(itemLeft, 0) + 'px';
      this.setItemInBox(e, targetContainer);
      this.updateSourceItemsCount();
    }
    this.draggedItem = null;
    this.scrollInterval = null;
  }

  this.itemDragStart = function (e) {
    if(e.target.classList.contains('menuExpanded')) return;
    e.target.classList.add('dragging');
    this.elevate(e.target);
  }

  this.setDragOver = function (e) {
    e.preventDefault();
  }

  this.itemDragEnd = function (e) {
    let targetContainer = document.elementFromPoint(e.clientX, e.clientY);
    if(!targetContainer.classList.contains('itemDroppableContainer')) {
      targetContainer = targetContainer.closest('.itemDroppableContainer');
    }
    targetContainer.appendChild(e.target);
    e.target.style.left = (e.clientX - parseInt(targetContainer.dataset.left) - parseInt(e.target.dataset.offsetX)) + 'px';
    e.target.style.top = (e.clientY - parseInt(targetContainer.dataset.top) - parseInt(e.target.dataset.offsetY)) + 'px';

    e.target.classList.remove('dragging');
    this.setItemInBox(e, targetContainer);
    this.updateSourceItemsCount();
  }

  /* eof Touch Drag */

  this.renderLine = function (l, currentLineIndex, entry) {
    const dataset = {
      'original-index': l.originalIndex
    };
    if(currentLineIndex != null && l.originalIndex == currentLineIndex) {
      dataset.current = true;
    }
    if(l.speakable) {
      dataset.reading = l.text;
    }
    if(entry.reviewLevel && l.originalIndex == 0) {
      dataset['review-level'] = entry.reviewLevel
    }

    const attrs = {};

    if(l.speakable) {
      attrs.speakable = 'true';
    }
    if(l.role) {
      attrs.role = l.role;
    }
    if(l.isCompact) {
      attrs.compact = true;
    }

    let attrsParsed = '';
    for(let attr in attrs) {
      attrsParsed += ` ${attr}="${attrs[attr]}"`;
    }

    let datasetParsed = '';
    for(let dataAttr in dataset) {
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
    if(reading) {
      lines = entry.lines.filter(l => l.role != DataFactory.LINE_ROLE.reading);
    }
    //let currentIndex = this.state.lineIndexes[entry.originalIndex] ?? null;
    let currentIndex = null;
    let reorderedLines = null;
    if(currentIndex == null) {
      let theOrder = null;
      const transArr = [];
      switch(mode) {
        case 'expression':
        case 'example':
          theOrder = DataFactory.lineOrders[mode];
          reorderedLines = theOrder.flatMap(role => {
            const subArr = lines.filter(line => line.role == role);
            if(!subArr.length) return [null];

            if(['example', 'example_translation'].includes(role)) {
              return shuffleArray(subArr)
            } else {
              return subArr
            }
          }).filter(o => o != null);
          break;
        case 'example_translation':
        case 'meaning':
          theOrder = DataFactory.lineOrders[mode];
          reorderedLines = theOrder.flatMap(role => {
            const subArr = lines.filter(line => line.role == role);
            if(!subArr.length) return [null];

            if('example_translation' == role) {
              shuffleArray(subArr).forEach(line => {
                transArr.push(line);
                const orig = lines.find(ll => ll.translationLineIndex
                  == line.originalIndex);
                if(orig) {
                  transArr.push(orig);
                }
              });
              return transArr;
            } else if('example' == role) {
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
    if(currentIndex == null) {
      currentIndex = reorderedLines[0].originalIndex;
    }
    const finalLines = reorderedLines || lines;
    const entryActions = `
    <div class="itemActions">
      <div class="itemAction removeItem">✖</div>
      <div class="itemAction expandLine">⇕</div>
      <div class="itemAction rotateBack">←</div>
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
    this.updateSourceItemsCount();
    this.tagsLegend.innerHTML = DataFactory.buildLegendHtml();
    this.unFastenItems();
    this.renderPanelBoxControls();
  };

  this.renderPanelBoxControls = function () {
    [...this.element.querySelectorAll('.itemDroppableContainer')].forEach(box => {
      box.insertAdjacentHTML('afterbegin', `
        <div class="clear">x</div>
        <div class="focus"></div>
      `)
    })
  }

  this.unFastenItems = function () {
    [...this.element.querySelectorAll('.itemDroppableContainer')].forEach(box => {
      if(box.id == 'panelSources') {
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
      box.removeAttribute('style');
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
    if(prop == 'mode') {
      this.state.lineIndexes = [];
      this.updateModeElement(this.cardModeEl)
    }
  };

  this.reset = function (resetAll) {
    this.panelSources.innerHTML = '';
    this.box1.innerHTML = '';
    this.box2.innerHTML = '';
    this.box3.innerHTML = '';
    this.box4.innerHTML = '';
    this.sourceItemCounter.innerHTML = '';
    this.resetBoxesDimensions();
    this.resetItems();
    this.element.querySelector('#markGlobal').removeAttribute('checked');

    if(resetAll == true) {
      this.state.removedItems = this.state.removedItems.filter(index =>
        !this.data.entries.find(entry => entry.originalIndex == index)
      );
      this.state.itemsInBoxes = this.filterStateObjByCurrentEntries(this.state.itemsInBoxes);
      //this.state.lineIndexes = this.filterStateObjByCurrentEntries(this.state.lineIndexes);
      this.state.mode = 'original';
      Application.views.StructureView.render();
    }
    this.data = {};
  };

  this.render = function (resetAll) {
    this.reset(resetAll);
    this.initState();
    if(!Application.getCurrentSourceData()?.currentEntries.length) {
      if(Application.views.PreloaderView.isShown()) {
        Application.views.PreloaderView.hide();
      }
      return
    }
    this.data.entries = structuredClone(
      Application.getCurrentSourceData().currentEntries
    );

    this.updateModeElement(this.cardModeEl)

    if(this.state.itemsInBoxes == null) this.state.itemsInBoxes = {};
    if(this.state.removedItems == null) this.state.removedItems = [];

    this.renderPanel();
    this.setPanelLayout();

    if(!this.renderedEventSet) {
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
    this.sourceItemCounter = this.element.querySelector('#sourceItemsCounter');
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
    this.viewActionsContainer = this.element.querySelector("#panelActionsBlock");
    this.tagsLegend = this.element.querySelector('#panelLegend');

    this.renderedEventSet = null;

    this.viewActions = new DropdownAction({
      trigger: new BurgerButton(),
      items: { 
        resetPanel: 'Reset',
        setGlobal: 'Set as global'
      },
      onSelect: (methodName) => this[methodName](),
      appendTo: this.viewActionsContainer
    });


    this.render();
  }
}

PanelView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templatePath: 'modules/panel/panel.html',
  templateSelector: '#panelView',
  longtouchTimeout: 200,
});

PanelView.prototype.constructor = PanelView;